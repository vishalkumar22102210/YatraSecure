import os

# Directories to scan
base_dirs = [
    r"D:\yatrasecure\yatrasecure-api",
    r"D:\yatrasecure\yatrasecure-web"
]

# Extensions to read as text
text_extensions = {
    '.ts', '.tsx', '.js', '.jsx', '.json', '.prisma', '.sql',
    '.toml', '.hbs', '.css', '.mjs', '.md', '.env', '.prettierrc',
    '.gitignore', '.py', '.txt'
}

# Folders to skip
skip_folders = {'node_modules', '.next', 'dist', 'build', '.git', '__pycache__'}

output_dir = r"D:\yatrasecure"
base_filename = "all_code_dump"

# 450 KB limit
MAX_SIZE = 450 * 1024

file_index = 1
current_size = 0
output_path = os.path.join(output_dir, f"{base_filename}_{file_index}.txt")

out = open(output_path, 'w', encoding='utf-8')

def write_data(data):
    global current_size, file_index, out, output_path

    encoded = data.encode('utf-8')
    size = len(encoded)

    if current_size + size > MAX_SIZE:
        out.close()
        file_index += 1
        output_path = os.path.join(output_dir, f"{base_filename}_{file_index}.txt")
        out = open(output_path, 'w', encoding='utf-8')
        current_size = 0

    out.write(data)
    current_size += size


write_data("=" * 80 + "\n")
write_data("YATRASECURE - FULL CODE DUMP\n")
write_data("=" * 80 + "\n\n")

for base_dir in base_dirs:
    for root, dirs, files in os.walk(base_dir):

        dirs[:] = [d for d in dirs if d not in skip_folders]

        for filename in sorted(files):

            filepath = os.path.join(root, filename)
            ext = os.path.splitext(filename)[1].lower()

            header = (
                "=" * 80 + "\n" +
                f"FILE: {filepath}\n" +
                "=" * 80 + "\n"
            )

            write_data(header)

            if ext in text_extensions or filename in {'.env', '.env.local', '.prettierrc', '.gitignore'}:
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                        content = f.read()
                    write_data(content)
                except Exception as e:
                    write_data(f"[ERROR READING FILE: {e}]\n")
            else:
                write_data("[BINARY OR UNSUPPORTED FILE - SKIPPED]\n")

            write_data("\n\n")

out.close()

print("Done! Files created in:", output_dir)