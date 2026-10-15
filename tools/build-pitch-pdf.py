from pathlib import Path
import shutil
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / 'tmp/pdfs/pitch-revisado'
BUILD.mkdir(parents=True, exist_ok=True)
OUTPUT = ROOT / 'Pitch-Quantum-Security.pdf'
BACKUP = BUILD / 'Pitch-Quantum-Security-original.pdf'
if not BACKUP.exists():
    shutil.copy2(OUTPUT, BACKUP)
for name, filename in [('Arial', 'arial.ttf'), ('Arial-Bold', 'arialbd.ttf')]:
    pdfmetrics.registerFont(TTFont(name, 'C:/Windows/Fonts/' + filename))
W, H = 960, 540
WHITE, CYAN, MUTED, AMBER = '#F0F7FF', '#61E8ED', '#AEBED1', '#FFBB72'
# Reuse artwork embedded in the versioned PDF instead of private build assets.
BG = BUILD / 'fundo-orbital.png'
with OUTPUT.open('rb') as source_pdf:
    images = PdfReader(source_pdf).pages[0].images
    if not images:
        raise ValueError('O PDF existente precisa conter a arte orbital.')
    max(images, key=lambda image: image.image.width * image.image.height).image.save(BG)
CANDIDATE = BUILD / 'Pitch-Quantum-Security-revisado.pdf'
c = canvas.Canvas(str(CANDIDATE), pagesize=(W,H), pageCompression=1)
c.setTitle('Quantum Security - Pitch de produto')
c.setAuthor('Quantum Security')
c.setSubject('Problema, solução com QKD, aplicação proposta e viabilidade')

def text(lines, top, size=20, color=WHITE, bold=False, x=48, width=562):
    font = 'Arial-Bold' if bold else 'Arial'
    c.setFont(font, size)
    c.setFillColor(color)
    for i, line in enumerate(lines.split('\n')):
        assert pdfmetrics.stringWidth(line, font, size) <= width, (line, size)
        y = H-top-size-i*size*1.27
        assert y > 10, (line,y)
        c.drawString(x,y,line)

def page(n):
    c.drawImage(str(BG),0,0,width=W,height=H)
    text('QUANTUM SECURITY',30,15,CYAN,True)
    times = ['0:00-0:30','0:30-1:00','1:00-1:30','1:30-2:00']
    text(f'PESSOA {n}   {times[n-1]}',60,13,MUTED)
    text(f'{n:02}',30,15,MUTED,x=873,width=40)

def source(label,url):
    text(label,515,9,MUTED)
    c.linkURL(url,(48,14,48+pdfmetrics.stringWidth(label,'Arial',9),26),relative=0)

page(1)
text('O risco começa\nna troca de chaves',105,42,bold=True)
text('O problema',237,23,CYAN,True)
text('Uma troca de chaves comprometida pode\nexpor dados sigilosos e comandos.',275,21)
text('Quem é afetado',355,23,CYAN,True)
text('Empresas e centros de pesquisa que trocam\ninformações estratégicas entre unidades.',393,21)
text('O valor em jogo: sigilo e confiança na comunicação.',480,18,AMBER)
c.showPage()

page(2)
text('Quantum Security:\nchaves sob controle',105,42,bold=True)
text('Software que integra equipamentos de distribuição\nquântica de chaves (QKD) à comunicação existente.',229,20)
text('A tecnologia a favor do cliente',306,23,CYAN,True)
text('Estados quânticos permitem gerar chaves secretas.\nO protocolo verifica os erros e só libera novas chaves\nquando seus critérios de segurança são atendidos.',348,20)
text('Benefício: renovação de chaves\ncom monitoramento do canal.',444,22,CYAN,True)
source('Base técnica: ETSI GS QKD 005 - Security Proofs','https://www.etsi.org/deliver/etsi_gs/QKD/001_099/005/01.01.01_60/gs_qkd005v010101p.pdf')
c.showPage()

page(3)
text('Aplicação: dois centros\nde pesquisa conectados',105,39,bold=True)
for number,top,title,detail in [
    ('01',234,'Gerar as chaves','Equipamentos QKD ligados por fibra óptica.'),
    ('02',319,'Integrar o software','Chaves validadas para cifrar dados na rede existente.'),
    ('03',404,'Acompanhar a operação','Uma interface com taxa de erros e alertas.')]:
    text(number,top,22,CYAN,True,width=40)
    text(title,top,23,WHITE,True,x=94,width=520)
    text(detail,top+35,18.5,MUTED,x=94,width=520)
text('Oferta proposta: integração e suporte ao cliente.',489,19,CYAN)
c.showPage()

page(4)
text('Um piloto antes\nda expansão',105,42,bold=True)
text('Condição necessária',234,23,CYAN,True)
text('Equipamentos QKD, enlace óptico e canal clássico\nautenticado. Os pontos finais precisam ser seguros.',272,19.5)
text('Risco a validar',340,23,AMBER,True)
text('Ruído e perdas podem interromper a geração de chaves.\nHardware e operação exigem investimento.',378,19)
text('Nossa proposta: um piloto entre duas unidades',445,21,CYAN,True)
text('Medir erros, disponibilidade e custo antes de ampliar.',481,18.5)
source('Base técnica: NSA - limitações operacionais de QKD','https://www.nsa.gov/Cybersecurity/Quantum-Key-Distribution-QKD-and-Quantum-Cryptography-QC/')
c.showPage()
c.save()

with pdfplumber.open(CANDIDATE) as doc:
    assert len(doc.pages)==4
    for i,p in enumerate(doc.pages,1):
        assert (p.width,p.height)==(W,H)
        content=p.extract_text()
        assert content and '\ufffd' not in content
        p.to_image(resolution=100).save(str(BUILD/f'pagina-{i}.png'))
        print(f'Página {i}: {len(content.split())} palavras, renderizada.')
shutil.copy2(CANDIDATE,OUTPUT)
print(f'PDF atualizado: {OUTPUT}')
