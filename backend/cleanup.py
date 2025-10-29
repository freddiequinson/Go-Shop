"""
Cleanup script for GoShopGhana backend
Removes debug scripts and temporary files we no longer need
"""

import os
import shutil
from pathlib import Path

def cleanup_files():
    """Remove unnecessary files and scripts"""
    
    files_to_remove = [
        "goshopghana.db",  # SQLite database file (we use PostgreSQL)
        "test_auth.py",    # Authentication test script (no longer needed)
        "test_db_connection.py",  # Database connection test (no longer needed)
        "check_tables.py", # Table checking script (no longer needed)
        "create_admin.py", # Admin creation script (admin already created)
        "setup_backend.py", # Backend setup script (setup complete)
        "setup_instructions.md", # Setup instructions (no longer needed)
        "POSTGRESQL_SETUP_GUIDE.md", # Setup guide (no longer needed)
    ]
    
    directories_to_remove = [
        "__pycache__",  # Python cache directory
    ]
    
    print("🧹 Cleaning up GoShopGhana backend...")
    print("=" * 50)
    
    removed_count = 0
    
    # Remove files
    for file_name in files_to_remove:
        file_path = Path(file_name)
        if file_path.exists():
            try:
                file_path.unlink()
                print(f"✅ Removed: {file_name}")
                removed_count += 1
            except Exception as e:
                print(f"❌ Failed to remove {file_name}: {e}")
        else:
            print(f"⏭️  Not found: {file_name}")
    
    # Remove directories
    for dir_name in directories_to_remove:
        dir_path = Path(dir_name)
        if dir_path.exists() and dir_path.is_dir():
            try:
                shutil.rmtree(dir_path)
                print(f"✅ Removed directory: {dir_name}")
                removed_count += 1
            except Exception as e:
                print(f"❌ Failed to remove directory {dir_name}: {e}")
        else:
            print(f"⏭️  Directory not found: {dir_name}")
    
    print("\n" + "=" * 50)
    print(f"🎯 Cleanup Summary: {removed_count} items removed")
    
    # Show remaining important files
    print("\n📁 Remaining important files:")
    important_files = [
        ".env", ".env.example", "main.py", "requirements.txt", 
        "alembic.ini", "README.md", "app/", "alembic/"
    ]
    
    for item in important_files:
        item_path = Path(item)
        if item_path.exists():
            print(f"   ✅ {item}")
        else:
            print(f"   ❌ {item} (missing!)")
    
    print("\n🚀 Backend is now clean and ready for production!")

if __name__ == "__main__":
    cleanup_files()
