import sys
import os

# Ensure backend and project root folders are in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
sys.path.insert(0, backend_dir)
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "bigdata", "mapreduce"))

