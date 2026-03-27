import os
import time
import tempfile
from typing import List, Dict
from io import BytesIO
from dotenv import load_dotenv
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

def get_category_tag(filename: str) -> str:
    """
    Categorizes documents based on filename keywords.
    Generic implementation that works across any enterprise domain.
    """
    filename_lower = filename.lower()
    
    # Technical/Engineering content indicators
    technical_keywords = [
        "spec", "technical", "architecture", "design", "hardware", "software",
        "api", "interface", "protocol", "standard", "requirement", "performance",
        "security", "configuration", "system", "implementation", "deployment"
    ]
    
    # Sales/Business content indicators
    sales_keywords = [
        "pricing", "cost", "license", "service", "offering", "plan", "package",
        "contract", "sla", "agreement", "business", "benefits", "roi", "value",
        "sales", "marketing", "solution", "use case", "case study"
    ]
    
    # Support/Operations content indicators
    support_keywords = [
        "troubleshoot", "support", "help", "guide", "faq", "issue", "problem",
        "error", "warning", "debug", "install", "setup", "configure", "admin",
        "maintenance", "operation", "runbook", "procedure"
    ]
    
    # Count keyword matches
    technical_score = sum(1 for kw in technical_keywords if kw in filename_lower)
    sales_score = sum(1 for kw in sales_keywords if kw in filename_lower)
    support_score = sum(1 for kw in support_keywords if kw in filename_lower)
    
    # Return category with highest score
    max_score = max(technical_score, sales_score, support_score)
    
    if max_score == 0:
        return "General"
    elif technical_score == max_score:
        return "Technical"
    elif sales_score == max_score:
        return "Commercial"
    elif support_score == max_score:
        return "Support"
    else:
        return "General"

def ingest_docs(data_dir: str = "data"):
    """
    Parses PDFs with PyMuPDF, chunks them with optimized separators,
    and uploads to Pinecone with rich metadata (dept, timestamp).
    """
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print(f"Created {data_dir} directory. Please add PDFs and re-run.")
        return

    documents = []
    for file in os.listdir(data_dir):
        if file.endswith(".pdf"):
            file_path = os.path.join(data_dir, file)
            try:
                # Use PyMuPDF for better layout preservation
                loader = PyMuPDFLoader(file_path)
                loaded_docs = loader.load()
                
                # Enrich metadata
                category = get_category_tag(file)
                timestamp = int(time.time())
                
                for doc in loaded_docs:
                    doc.metadata.update({
                        "source": file,
                        "category": category,
                        "timestamp": timestamp,
                        "page_number": doc.metadata.get("page", 0)
                    })
                documents.extend(loaded_docs)
                print(f"Loaded: {file} (Category: {category})")
            except Exception as e:
                print(f"Error loading {file}: {e}")

    if not documents:
        print("No documents found to ingest.")
        return

    # Optimized chunking for enterprise docs
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ""],
        add_start_index=True
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Generated {len(chunks)} chunks.")

    # Vector DB Setup
    embeddings = HuggingFaceEmbeddings(model_name=os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"))
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index_name = os.getenv("PINECONE_INDEX_NAME")

    # Create index if it doesn't exist
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=384, # Dimension for all-MiniLM-L6-v2
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )

    # Upsert to Pinecone directly
    try:
        index = pc.Index(index_name)
        vectors_to_upsert = []
        
        for idx, chunk in enumerate(chunks):
            # Generate embedding for chunk
            embedding = embeddings.embed_query(chunk.page_content)
            
            # Create unique ID for each chunk (incremental)
            chunk_id = f"chunk_{idx}"
            
            # Prepare vector for upsert with rich metadata
            vector = (
                chunk_id,
                embedding,
                {
                    "source": chunk.metadata.get("source", "Unknown"),
                    "category": chunk.metadata.get("category", "General"),
                    "page_number": chunk.metadata.get("page_number", 0),
                    "timestamp": chunk.metadata.get("timestamp", int(time.time())),
                    "text": chunk.page_content[:500]  # Store first 500 chars as preview
                }
            )
            vectors_to_upsert.append(vector)
        
        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(vectors_to_upsert), batch_size):
            batch = vectors_to_upsert[i:i + batch_size]
            index.upsert(vectors=batch)
            print(f"Upserted batch {i // batch_size + 1}/{(len(vectors_to_upsert) + batch_size - 1) // batch_size}")
        
        print(f"Successfully ingested {len(vectors_to_upsert)} vectors into Pinecone index '{index_name}'.")
    except Exception as e:
        print(f"Failed to upsert to Pinecone: {e}")

def ingest_from_files(files: List[tuple], data_dir: str = None) -> Dict:
    """
    Ingests PDFs from uploaded file objects (from FastAPI UploadFile).
    Args:
        files: List of tuples (filename, file_bytes) or list of file-like objects with name attribute.
        data_dir: Optional temporary directory to store files. If None, uses system temp.
    Returns:
        Dict with ingestion status, count of vectors upserted, and any errors.
    """
    documents = []
    errors = []
    
    # Create temporary directory if not provided
    if data_dir is None:
        data_dir = tempfile.mkdtemp()
    else:
        os.makedirs(data_dir, exist_ok=True)
    
    try:
        # Write uploaded files to disk
        file_paths = []
        for file_obj in files:
            try:
                # Handle both (filename, bytes) tuples and UploadFile objects
                if isinstance(file_obj, tuple):
                    filename, file_bytes = file_obj
                else:
                    filename = file_obj.filename
                    file_bytes = file_obj.file.read()
                
                if not filename.lower().endswith('.pdf'):
                    errors.append(f"Skipped {filename}: only PDF files are supported")
                    continue
                
                # Write to temp directory
                file_path = os.path.join(data_dir, filename)
                with open(file_path, 'wb') as f:
                    f.write(file_bytes)
                file_paths.append((filename, file_path))
            except Exception as e:
                errors.append(f"Error processing {filename}: {str(e)}")
                continue
        
        if not file_paths:
            return {
                "status": "failed",
                "message": "No valid PDF files to ingest",
                "vectors_upserted": 0,
                "errors": errors
            }
        
        # Load and process PDFs
        for filename, file_path in file_paths:
            try:
                loader = PyMuPDFLoader(file_path)
                loaded_docs = loader.load()
                
                # Enrich metadata
                category = get_category_tag(filename)
                timestamp = int(time.time())
                
                for doc in loaded_docs:
                    doc.metadata.update({
                        "source": filename,
                        "category": category,
                        "timestamp": timestamp,
                        "page_number": doc.metadata.get("page", 0)
                    })
                documents.extend(loaded_docs)
                print(f"Loaded: {filename} (Category: {category})")
            except Exception as e:
                error_msg = f"Error loading {filename}: {str(e)}"
                errors.append(error_msg)
                print(error_msg)
                continue
        
        if not documents:
            return {
                "status": "failed",
                "message": "No documents extracted from PDFs",
                "vectors_upserted": 0,
                "errors": errors
            }
        
        # Chunk documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", " ", ""],
            add_start_index=True
        )
        chunks = text_splitter.split_documents(documents)
        print(f"Generated {len(chunks)} chunks.")
        
        # Vector DB setup
        embeddings = HuggingFaceEmbeddings(
            model_name=os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
        )
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        index_name = os.getenv("PINECONE_INDEX_NAME")
        
        # Create index if it doesn't exist
        if index_name not in pc.list_indexes().names():
            pc.create_index(
                name=index_name,
                dimension=384,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
        
        # Upsert to Pinecone
        index = pc.Index(index_name)
        vectors_to_upsert = []
        
        for idx, chunk in enumerate(chunks):
            embedding = embeddings.embed_query(chunk.page_content)
            chunk_id = f"chunk_{int(time.time())}_{idx}"
            
            vector = (
                chunk_id,
                embedding,
                {
                    "source": chunk.metadata.get("source", "Unknown"),
                    "category": chunk.metadata.get("category", "General"),
                    "page_number": chunk.metadata.get("page_number", 0),
                    "timestamp": chunk.metadata.get("timestamp", int(time.time())),
                    "text": chunk.page_content[:500]
                }
            )
            vectors_to_upsert.append(vector)
        
        # Upsert in batches
        batch_size = 100
        for i in range(0, len(vectors_to_upsert), batch_size):
            batch = vectors_to_upsert[i:i + batch_size]
            index.upsert(vectors=batch)
            batch_num = i // batch_size + 1
            total_batches = (len(vectors_to_upsert) + batch_size - 1) // batch_size
            print(f"Upserted batch {batch_num}/{total_batches}")
        
        return {
            "status": "success",
            "message": f"Successfully ingested {len(vectors_to_upsert)} vectors",
            "vectors_upserted": len(vectors_to_upsert),
            "documents_processed": len(file_paths),
            "errors": errors if errors else None
        }
    
    except Exception as e:
        error_msg = f"Failed to ingest documents: {str(e)}"
        errors.append(error_msg)
        return {
            "status": "failed",
            "message": error_msg,
            "vectors_upserted": 0,
            "errors": errors
        }
    
    finally:
        # Clean up temporary files
        if data_dir and os.path.exists(data_dir):
            try:
                for file in os.listdir(data_dir):
                    os.remove(os.path.join(data_dir, file))
                os.rmdir(data_dir)
            except:
                pass

if __name__ == "__main__":
    ingest_docs()
