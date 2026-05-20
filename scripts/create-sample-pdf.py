"""Create two sample PDFs for eAi testing."""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def create_pdf(path, lines):
    c = canvas.Canvas(path, pagesize=A4)
    c.setFont("Helvetica", 12)
    y = 780
    for line in lines:
        c.drawString(60, y, line)
        y -= 22
    c.save()
    print(f"Created: {path}")

# PDF 1: Don nghi phep - Tran Thi Bich
create_pdf("E:/Du_an/scripts/don-nghi-phep-tran-thi-bich.pdf", [
    "CONG HOA XA HOI CHU NGHIA VIET NAM",
    "Doc lap - Tu do - Hanh phuc",
    "",
    "              DON XIN NGHI PHEP",
    "",
    "Kinh gui: Ban Giam doc Cong ty",
    "Phong Nhan su - Dao tao",
    "",
    "Toi ten la: Tran Thi Bich",
    "Sinh ngay: 15/08/1995",
    "So CCCD: 023456789012",
    "Phong ban: Phong Ke toan",
    "Chuc vu: Ke toan vien",
    "",
    "Toi xin phep nghi tu ngay 25/05/2026 den ngay 28/05/2026",
    "Tong so ngay nghi: 4 ngay lam viec",
    "Ly do nghi phep: Viec gia dinh (dam cuoi anh trai)",
    "",
    "Nguoi thay the cong viec: Nguyen Thi Lan",
    "",
    "Toi xin cam doan da ban giao cong viec day du truoc khi nghi.",
    "",
    "Ha Noi, ngay 20 thang 05 nam 2026",
    "",
    "                              Nguoi viet don",
    "",
    "                              Tran Thi Bich",
])

# PDF 2: Don nghi phep - Le Van Minh
create_pdf("E:/Du_an/scripts/don-nghi-phep-le-van-minh.pdf", [
    "CONG HOA XA HOI CHU NGHIA VIET NAM",
    "Doc lap - Tu do - Hanh phuc",
    "",
    "              DON XIN NGHI PHEP",
    "",
    "Kinh gui: Truong phong Ky thuat",
    "",
    "Toi ten la: Le Van Minh",
    "Sinh ngay: 22/03/1990",
    "So CCCD: 034567890123",
    "Phong ban: Phong Ky thuat",
    "Chuc vu: Ky su phan mem",
    "",
    "Xin nghi phep tu ngay 01/06/2026 den ngay 05/06/2026",
    "Tong so ngay nghi: 5 ngay",
    "Ly do: Kham suc khoe dinh ky va nghi duong",
    "",
    "Ha Noi, ngay 20 thang 05 nam 2026",
    "",
    "                              Nguoi lam don",
    "",
    "                              Le Van Minh",
])

print("Done! Two sample PDFs created in E:/Du_an/scripts/")
