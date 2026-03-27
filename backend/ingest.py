import os
import time
from typing import List, Dict
from dotenv import load_dotenv
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
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

    # 4. Upsert to Pinecone
    try:
        PineconeVectorStore.from_documents(
            chunks,
            embeddings,
            index_name=index_name
        )
        print("Successfully ingested documents into Pinecone.")
    except Exception as e:
        print(f"Failed to upsert to Pinecone: {e}")

if __name__ == "__main__":
    ingest_docs()
