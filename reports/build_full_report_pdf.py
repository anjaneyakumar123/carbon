import os
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    Image, KeepTogether, HRFlowable, Flowable
)
from reportlab.pdfgen import canvas

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PDF_PATH = os.path.join(BASE_DIR, 'IPRC_CarbonTrack_Minor_Project_Report.pdf')
FIG_DIR = os.path.join(os.path.dirname(__file__), 'figures')
LOGO_PATH = os.path.join(os.path.dirname(__file__), 'assets', 'nitrr_logo.png')
META_PATH = os.path.join(BASE_DIR, 'ml-service', 'models', 'models_metadata.json')

NAVY = colors.HexColor('#002147')
SUB_NAVY = colors.HexColor('#0b3b60')
ACCENT_BLUE = colors.HexColor('#2c5282')
BODY_COLOR = colors.HexColor('#1a202c')
MUTED = colors.HexColor('#4a5568')
HF_COLOR = colors.HexColor('#334155')
TBL_HDR_BG = colors.HexColor('#e8eff7')
TBL_SUM_BG = colors.HexColor('#f1f5f9')
RULE_GRAY = colors.HexColor('#cbd5e1')

class Marker(Flowable):
    """Zero-height marker to record exact page index (1-based) during 2-pass build."""
    def __init__(self, kind, key):
        super().__init__()
        self.kind = kind
        self.key = key
        self.width = 0
        self.height = 0

    def draw(self):
        pass

class TrackingDocTemplate(SimpleDocTemplate):
    def __init__(self, filename, tracker, **kwargs):
        super().__init__(filename, **kwargs)
        self.tracker = tracker

    def afterFlowable(self, flowable):
        if isinstance(flowable, Marker):
            self.tracker[flowable.kind][flowable.key] = self.page

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        page_num = self._pageNumber
        w, h = A4
        margin = 54

        if page_num == 1:
            self.restoreState()
            return

        roman_map = {2: 'ii', 3: 'iii', 4: 'iv', 5: 'v', 6: 'vi'}
        if page_num in roman_map:
            self.setFont('Times-Roman', 9)
            self.setFillColor(HF_COLOR)
            self.drawRightString(w - margin, 34, roman_map[page_num])
        else:
            body_num = page_num - 6
            total_body = max(1, page_count - 6)
            self.setFont('Times-Italic', 8.5)
            self.setFillColor(HF_COLOR)
            self.drawString(margin, h - 36, 'National Institute of Technology Raipur \u2014 Department of Information Technology')
            self.drawRightString(w - margin, h - 36, 'Minor Project Report')
            self.setStrokeColor(RULE_GRAY)
            self.setLineWidth(0.6)
            self.line(margin, h - 42, w - margin, h - 42)

            self.setFont('Times-Roman', 8.5)
            self.drawString(margin, 34, 'Department of Information Technology, NIT Raipur')
            self.setFont('Times-Bold', 8.5)
            self.drawRightString(w - margin, 34, f'Page {body_num} of {total_body}')

        self.restoreState()

def make_styles():
    s = getSampleStyleSheet()
    return {
        'cover_inst': ParagraphStyle('ci', parent=s['Normal'], fontName='Times-Bold', fontSize=15.5, leading=20, alignment=TA_CENTER, textColor=NAVY),
        'cover_dept': ParagraphStyle('cd', parent=s['Normal'], fontName='Times-Bold', fontSize=11.5, leading=16, alignment=TA_CENTER, textColor=ACCENT_BLUE),
        'cover_type': ParagraphStyle('ct', parent=s['Normal'], fontName='Times-Bold', fontSize=13, leading=18, alignment=TA_CENTER, textColor=NAVY),
        'cover_on': ParagraphStyle('co', parent=s['Normal'], fontName='Times-Bold', fontSize=11, leading=16, alignment=TA_CENTER, textColor=MUTED),
        'cover_proj': ParagraphStyle('cp', parent=s['Normal'], fontName='Times-Bold', fontSize=16.5, leading=22, alignment=TA_CENTER, textColor=SUB_NAVY),
        'cover_sub': ParagraphStyle('cs', parent=s['Normal'], fontName='Times-Italic', fontSize=11, leading=15, alignment=TA_CENTER, textColor=MUTED),
        'cover_meta_b': ParagraphStyle('cmb', parent=s['Normal'], fontName='Times-Bold', fontSize=10.5, leading=15, textColor=BODY_COLOR),
        'cover_meta': ParagraphStyle('cm', parent=s['Normal'], fontName='Times-Roman', fontSize=10.5, leading=15, textColor=BODY_COLOR),
        'front_title': ParagraphStyle('ft', parent=s['Normal'], fontName='Times-Bold', fontSize=14, leading=18, alignment=TA_CENTER, textColor=NAVY, spaceAfter=14),
        'chapter': ParagraphStyle('ch', parent=s['Normal'], fontName='Times-Bold', fontSize=14.8, leading=19, textColor=NAVY, spaceBefore=4, spaceAfter=10),
        'h2': ParagraphStyle('h2', parent=s['Normal'], fontName='Times-Bold', fontSize=11.5, leading=15.5, textColor=SUB_NAVY, spaceBefore=10, spaceAfter=5),
        'h3': ParagraphStyle('h3', parent=s['Normal'], fontName='Times-Bold', fontSize=10.4, leading=14, textColor=ACCENT_BLUE, spaceBefore=6, spaceAfter=3.5),
        'body': ParagraphStyle('body', parent=s['Normal'], fontName='Times-Roman', fontSize=10.0, leading=14.8, alignment=TA_JUSTIFY, textColor=BODY_COLOR, spaceAfter=7.5),
        'bullet': ParagraphStyle('bul', parent=s['Normal'], fontName='Times-Roman', fontSize=9.9, leading=14.4, alignment=TA_JUSTIFY, textColor=BODY_COLOR, leftIndent=14, firstLineIndent=-8, spaceAfter=5.0),
        'eq': ParagraphStyle('eq', parent=s['Normal'], fontName='Times-Italic', fontSize=10.1, leading=15.0, alignment=TA_CENTER, textColor=NAVY, spaceBefore=7, spaceAfter=8),
        'caption': ParagraphStyle('cap', parent=s['Normal'], fontName='Times-Italic', fontSize=9.0, leading=12.5, alignment=TA_CENTER, textColor=HF_COLOR, spaceBefore=4, spaceAfter=9),
        'tbl_title': ParagraphStyle('tt', parent=s['Normal'], fontName='Times-Bold', fontSize=9.5, leading=13, alignment=TA_CENTER, textColor=NAVY, spaceBefore=6, spaceAfter=5),
        'tbl_hdr': ParagraphStyle('th', parent=s['Normal'], fontName='Times-Bold', fontSize=8.4, leading=11, alignment=TA_CENTER, textColor=NAVY),
        'tbl_cell': ParagraphStyle('tc', parent=s['Normal'], fontName='Times-Roman', fontSize=8.3, leading=11.2, alignment=TA_LEFT, textColor=BODY_COLOR),
        'tbl_cell_c': ParagraphStyle('tcc', parent=s['Normal'], fontName='Times-Roman', fontSize=8.3, leading=11.2, alignment=TA_CENTER, textColor=BODY_COLOR),
        'tbl_cell_b': ParagraphStyle('tcb', parent=s['Normal'], fontName='Times-Bold', fontSize=8.3, leading=11.2, alignment=TA_LEFT, textColor=NAVY),
        'ref': ParagraphStyle('ref', parent=s['Normal'], fontName='Times-Roman', fontSize=9.2, leading=12.8, alignment=TA_JUSTIFY, textColor=BODY_COLOR, leftIndent=20, firstLineIndent=-20, spaceAfter=5.5),
        'toc_l': ParagraphStyle('tl', parent=s['Normal'], fontName='Times-Bold', fontSize=9.8, leading=13, textColor=BODY_COLOR),
        'toc_d': ParagraphStyle('td', parent=s['Normal'], fontName='Times-Roman', fontSize=9.2, leading=13, textColor=MUTED, alignment=TA_CENTER),
        'toc_r': ParagraphStyle('tr', parent=s['Normal'], fontName='Times-Bold', fontSize=9.8, leading=13, textColor=NAVY, alignment=TA_RIGHT),
        'lof_l': ParagraphStyle('ll', parent=s['Normal'], fontName='Times-Roman', fontSize=8.6, leading=11.2, textColor=BODY_COLOR),
    }

def add_figure(story, st, img_name, caption_text, key, w_inch=6.25, h_inch=2.85):
    path = os.path.join(FIG_DIR, img_name)
    img = Image(path, width=w_inch*72, height=h_inch*72, kind='proportional')
    tbl = Table([[img]], colWidths=[487])
    tbl.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOX', (0, 0), (-1, -1), 0.5, RULE_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(KeepTogether([
        Marker('figures', key),
        tbl,
        Paragraph(caption_text, st['caption'])
    ]))

def add_styled_table(story, st, title_text, headers, rows, col_widths, key, summary_last=False):
    data = [[Paragraph(h, st['tbl_hdr']) for h in headers]]
    for r_idx, row in enumerate(rows):
        is_sum = summary_last and (r_idx == len(rows) - 1)
        styled_row = []
        for c_idx, cell in enumerate(row):
            style = st['tbl_cell_b'] if is_sum else (st['tbl_cell'] if c_idx == 0 else st['tbl_cell_c'])
            styled_row.append(Paragraph(str(cell), style))
        data.append(styled_row)

    t = Table(data, colWidths=col_widths, repeatRows=1)
    ts = [
        ('BACKGROUND', (0, 0), (-1, 0), TBL_HDR_BG),
        ('LINEABOVE', (0, 0), (-1, 0), 1.2, NAVY),
        ('LINEBELOW', (0, 0), (-1, 0), 0.9, NAVY),
        ('LINEBELOW', (0, -1), (-1, -1), 1.2, NAVY),
        ('GRID', (0, 1), (-1, -1), 0.35, RULE_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4.0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4.0),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]
    if summary_last:
        ts.append(('BACKGROUND', (0, -1), (-1, -1), TBL_SUM_BG))
    t.setStyle(TableStyle(ts))
    story.append(KeepTogether([
        Marker('tables', key),
        Paragraph(title_text, st['tbl_title']),
        t,
        Spacer(1, 9)
    ]))

def make_toc_table(entries, page_map, st, is_lof=False):
    rows = []
    for key, label, default_pg in entries:
        pg = page_map.get(key, default_pg)
        if isinstance(pg, int) and pg > 6:
            pg_str = str(pg - 6)
        else:
            pg_str = str(pg)
        lbl_style = st['lof_l'] if is_lof else st['toc_l']
        dots = '. ' * 15 if is_lof else '. ' * 22
        rows.append([Paragraph(label, lbl_style), Paragraph(dots, st['toc_d']), Paragraph(pg_str, st['toc_r'])])
    cw = [330, 120, 35] if is_lof else [260, 190, 35]
    t = Table(rows, colWidths=cw)
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.4 if is_lof else 5.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.4 if is_lof else 5.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    return t

def build_story(st, meta, tracker_ref):
    story = []

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 18))
    story.append(Paragraph('NATIONAL INSTITUTE OF TECHNOLOGY RAIPUR', st['cover_inst']))
    story.append(Paragraph('DEPARTMENT OF INFORMATION TECHNOLOGY', st['cover_dept']))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width='82%', thickness=1.5, color=NAVY, spaceBefore=2, spaceAfter=18))

    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=96, height=96, kind='proportional')
        logo.hAlign = 'CENTER'
        story.append(logo)
    story.append(Spacer(1, 16))

    story.append(Paragraph('MINOR PROJECT REPORT', st['cover_type']))
    story.append(Spacer(1, 4))
    story.append(Paragraph('ON', st['cover_on']))
    story.append(Spacer(1, 8))
    story.append(Paragraph('IPRC CARBONTRACK: CARBON FOOTPRINT MONITORING<br/>AND PREDICTIVE ANALYTICS PLATFORM', st['cover_proj']))
    story.append(Spacer(1, 6))
    story.append(Paragraph('(A Dual-Mode Greenhouse Gas Accounting and Machine Learning Regression System \u2014 RES-IPRC-2025-003)', st['cover_sub']))
    story.append(Spacer(1, 42))

    left_col = [
        Paragraph('<b>Submitted by:</b>', st['cover_meta_b']),
        Spacer(1, 8),
        Paragraph('<b>D. V. V. Anjaneya Kumar</b> (Roll No: 23118029)', st['cover_meta']),
        Paragraph('<b>Yash Mittal</b> (Roll No: 22118111)', st['cover_meta']),
        Spacer(1, 14),
        Paragraph('<b>Degree:</b> B.Tech', st['cover_meta']),
        Paragraph('<b>Branch:</b> Information Technology', st['cover_meta']),
        Paragraph('<b>Semester:</b> 7th Semester', st['cover_meta']),
    ]
    right_col = [
        Paragraph('<b>Guided by:</b>', st['cover_meta_b']),
        Spacer(1, 8),
        Paragraph('<b>Dr. Gyanendra Kumar Verma</b>', st['cover_meta']),
        Paragraph('Department of Information Technology', st['cover_meta']),
        Paragraph('National Institute of Technology Raipur', st['cover_meta']),
    ]
    cover_tbl = Table([[left_col, right_col]], colWidths=[265, 220])
    cover_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(cover_tbl)
    story.append(Spacer(1, 48))
    story.append(HRFlowable(width='92%', thickness=0.8, color=RULE_GRAY, spaceBefore=10, spaceAfter=6))
    story.append(PageBreak())

    # =========================================================================
    # PAGE ii: DECLARATION
    # =========================================================================
    if os.path.exists(LOGO_PATH):
        sm_logo = Image(LOGO_PATH, width=46, height=46, kind='proportional')
        sm_logo.hAlign = 'CENTER'
        story.append(sm_logo)
    story.append(Spacer(1, 10))
    story.append(Paragraph('<u>DECLARATION</u>', st['front_title']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'We hereby declare that this minor project report entitled <b>"IPRC CarbonTrack: Carbon Footprint Monitoring and Predictive Analytics Platform"</b> '
        'is our own original work completed under the guidance of <b>Dr. Gyanendra Kumar Verma</b>, Department of Information Technology, '
        'National Institute of Technology Raipur. This report contains no material previously published or written by another author except where due '
        'academic reference and citation is made in the text. All software modules, database schemas, and empirical benchmarks reported herein have been '
        'verified directly from the implemented codebase. This work has not been submitted for the award of any other degree or diploma.',
        st['body']
    ))
    story.append(Spacer(1, 24))
    story.append(Paragraph(
        '<b>Submitted by:</b><br/>'
        '<b>D. V. V. Anjaneya Kumar (23118029)</b><br/>'
        '<b>Yash Mittal (22118111)</b>',
        ParagraphStyle('rb', parent=st['body'], alignment=TA_RIGHT, leading=15)
    ))
    story.append(Spacer(1, 64))
    for _ in range(3):
        story.append(HRFlowable(width='38%', thickness=0.7, color=HF_COLOR, spaceBefore=22, spaceAfter=22))
    story.append(PageBreak())

    # =========================================================================
    # PAGE iii: ACKNOWLEDGEMENT
    # =========================================================================
    story.append(Spacer(1, 14))
    story.append(Paragraph('<u>ACKNOWLEDGEMENT</u>', st['front_title']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'It is a privilege to express our sincere gratitude to the faculty and mentors of the National Institute of Technology Raipur '
        'for their constant academic support, constructive criticism, and access to institutional computing resources throughout the 7th Semester '
        'Minor Project curriculum in the Department of Information Technology.',
        st['body']
    ))
    story.append(Paragraph(
        'We are deeply indebted to our project supervisor, <b>Dr. Gyanendra Kumar Verma</b>, Department of Information Technology, '
        'National Institute of Technology Raipur, for his technical mentorship, architectural review, and sustained encouragement from problem formulation '
        'through full-stack system verification. His emphasis on methodological rigor, zero-leakage validation, and clear separation between standardized '
        'statistical modelling and physical greenhouse gas accounting significantly shaped the final architecture of IPRC CarbonTrack.',
        st['body']
    ))
    story.append(Paragraph(
        'We further acknowledge the domain context provided by the ISRO Propulsion Complex (IPRC), Mahendragiri environmental monitoring research specification '
        '(Project Reference: <b>RES-IPRC-2025-003</b>), as well as authoritative emission factor inventories published by the Central Electricity Authority (CEA) '
        'of India, the Intergovernmental Panel on Climate Change (IPCC 2019 Refinement), and the Bureau of Energy Efficiency (BEE). Finally, we thank our peers '
        'and laboratory staff for assisting in end-to-end validation and usability testing.',
        st['body']
    ))
    story.append(Spacer(1, 44))
    story.append(Paragraph(
        '<b>D. V. V. Anjaneya Kumar (23118029)</b><br/><b>Yash Mittal (22118111)</b>',
        ParagraphStyle('rb2', parent=st['body'], alignment=TA_RIGHT, leading=15)
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE iv: ABSTRACT
    # =========================================================================
    story.append(Spacer(1, 14))
    story.append(Paragraph('<u>ABSTRACT</u>', st['front_title']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'Systematic quantification and forecasting of operational greenhouse gas (GHG) emissions are essential for industrial and aerospace test '
        'facilities seeking compliance with ISO 14064-1 and the Greenhouse Gas Protocol. Many existing organizational tools either compute static spreadsheet '
        'inventories without predictive intelligence or train black-box machine learning models directly on raw facility logs without isolating standardized '
        'research baselines from auditable physical consumption records.',
        st['body']
    ))
    story.append(Paragraph(
        'This report presents <b>IPRC CarbonTrack</b> (Research Reference: <b>RES-IPRC-2025-003</b>), a full-stack, three-tier carbon footprint monitoring, '
        'measurement, and predictive analytics platform designed for the operational context of ISRO Propulsion Complex (IPRC), Mahendragiri. The system enforces '
        'a clean <b>dual-mode architecture</b> across PostgreSQL: (i) <b>Mode A (Standardized Dataset &amp; ML Analytics)</b> ingests and analyzes a 10,000-record '
        'multi-year baseline dataset (2024\u20132051, 14 columns, zero missing or duplicate entries) containing 12 Z-score standardized operational/meteorological '
        'predictors and the physical target <i>Carbon_Emission_kgCO2</i> (mean = 22.956 kg CO2, range = 1.187\u201355.962 kg CO2); and (ii) <b>Mode B (Physical Activity '
        'Ledger)</b> computes deterministic emissions via <i>E = Q \u00d7 EF</i> across six operational categories and Scopes 1, 2, and 3 using 10 verified emission '
        'factors from CEA India Baseline v19 (0.82 kg CO2/kWh) and IPCC 2019 guidelines (2.68 kg CO2/L Diesel).',
        st['body']
    ))
    story.append(Paragraph(
        'The platform integrates a React 18 / Vite 5.4 / Chart.js frontend (15 role-gated routes), a Node.js / Express.js 4.21 REST backend secured with bcryptjs '
        'password hashing and HS256 JWT Role-Based Access Control (ADMIN, OFFICER, ANALYST), Prisma ORM 5.22 over PostgreSQL (13 relational models), and a Python '
        'FastAPI microservice serving four Scikit-Learn regressors trained with zero target leakage under both random 80/20 and chronological 80/20 splits. '
        'Empirical benchmarking demonstrates that Linear Regression achieves the strongest generalization (test R<super>2</super> = 0.8534, MAE = 2.961 kg CO2, '
        'RMSE = 3.765 kg CO2, chronological R<super>2</super> = 0.8451), outperforming Gradient Boosting (R<super>2</super> = 0.8474), Random Forest (R<super>2</super> = 0.8428), '
        'and Decision Tree (R<super>2</super> = 0.8243), driven predominantly by standardized energy usage (r = +0.705) and transportation distance (r = +0.590). '
        'Automated statutory exports via PDFKit (A4 summary audits) and ExcelJS (3-sheet workbooks), chunked CSV ingestion (validated with 100-row synthetic batch uploads '
        'bringing live DB records to 10,200), immutable audit logs, and Vite production bundling (1,671 modules in 3.48 s) confirm deployment readiness.',
        st['body']
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE v: CONTENTS
    # =========================================================================
    story.append(Spacer(1, 10))
    story.append(Paragraph('<u>CONTENTS</u>', st['front_title']))
    toc_entries = [
        ('cert', 'CERTIFICATE', 'i'),
        ('decl', 'DECLARATION', 'ii'),
        ('ack', 'ACKNOWLEDGEMENT', 'iii'),
        ('abs', 'ABSTRACT', 'iv'),
        ('lof', 'LIST OF FIGURES & TABLES', 'vi'),
        ('ch1', 'CHAPTER 1: INTRODUCTION', '1'),
        ('ch2', 'CHAPTER 2: LITERATURE REVIEW', '5'),
        ('ch3', 'CHAPTER 3: DATASET AND PREPROCESSING', '8'),
        ('ch4', 'CHAPTER 4: SYSTEM DESIGN AND METHODOLOGY', '11'),
        ('ch5', 'CHAPTER 5: MATHEMATICAL FORMULATION', '15'),
        ('ch6', 'CHAPTER 6: EXPERIMENTAL RESULTS AND EVALUATION', '18'),
        ('ch7', 'CHAPTER 7: DISCUSSION', '24'),
        ('ch8', 'CHAPTER 8: CONCLUSION AND FUTURE SCOPE', '26'),
        ('refs', 'REFERENCES', '28'),
    ]
    story.append(make_toc_table(toc_entries, tracker_ref.get('chapters', {}), st, is_lof=False))
    story.append(PageBreak())

    # =========================================================================
    # PAGE vi: LIST OF FIGURES & TABLES
    # =========================================================================
    story.append(Spacer(1, 2))
    story.append(Paragraph('<u>LIST OF FIGURES &amp; TABLES</u>', st['front_title']))
    story.append(Paragraph('<b>List of Figures</b>', st['h2']))
    fig_entries = [
        ('fig1', 'Fig. 1: Dual-Mode GHG Accounting & Predictive Analytics Framework', '2'),
        ('fig5', 'Fig. 2: Distribution & Sector Spread of Physical Target Carbon_Emission_kgCO2', '9'),
        ('fig6', 'Fig. 3: 13\u00d713 Multivariate Pearson Correlation Matrix & Driver Ranking', '9'),
        ('fig7', 'Fig. 4: Linear Dependence of Carbon Emission on Energy & Transport Z-Scores', '10'),
        ('fig2', 'Fig. 5: Decoupled Three-Tier Enterprise Microservice Architecture', '11'),
        ('fig3', 'Fig. 6: Normalized PostgreSQL Entity-Relationship Schema (Prisma Models)', '12'),
        ('fig4', 'Fig. 7: JWT Authentication, RBAC & Protected Request Lifecycle', '13'),
        ('fig8', 'Fig. 8: Mode B Operational Quantification Pipeline & Verified Factor Registry', '13'),
        ('fig12', 'Fig. 9: Validated Batch CSV Ingestion & Statutory Export Synthesis Pipeline', '14'),
        ('fig9', 'Fig. 10: Multi-Model Regression Benchmark (Random & Chronological Splits)', '19'),
        ('fig10', 'Fig. 11: Active Linear Regression Parity & Test Residual Error Distribution', '19'),
        ('fig11', 'Fig. 12: Standardized Feature Attribution Comparison Across Four ML Models', '20'),
    ]
    story.append(make_toc_table(fig_entries, tracker_ref.get('figures', {}), st, is_lof=True))
    story.append(Spacer(1, 4))
    story.append(Paragraph('<b>List of Tables</b>', st['h2']))
    tbl_entries = [
        ('tbl11', 'Table 1.1: Organizational Divisions & Carbon Source Mapping at IPRC Campus', '2'),
        ('tbl12', 'Table 1.2: RBAC Role Matrix & Division-Level Authorization Boundaries', '3'),
        ('tbl13', 'Table 1.3: Verified Full-Stack Development & Production Runtime Environment', '4'),
        ('tbl21', 'Table 2.1: Comparative Review of GHG Accounting & Prediction Approaches', '7'),
        ('tbl31', 'Table 3.1: Statistical Audit of Preprocessed Baseline Dataset (n = 10,000)', '8'),
        ('tbl32', 'Table 3.2: Transport Mode, Building Sector & Renewable Quartile Stratification', '10'),
        ('tbl41', 'Table 4.1: Mounted Express REST API Routes, Prisma Models & RBAC Policies', '12'),
        ('tbl42', 'Table 4.2: Implemented React SPA Views Mapped to Functional Modules', '14'),
        ('tbl51', 'Table 5.1: Regression Hyperparameters & Mode B Deterministic Quantification Rules', '17'),
        ('tbl61', 'Table 6.1: Longitudinal Yearly Baseline Summary Across Selected Years', '18'),
        ('tbl62', 'Table 6.2: ML Regression Evaluation Metrics Across Four Benchmarked Models', '19'),
        ('tbl63', 'Table 6.3: Active OLS Coefficients & Test Absolute Error Percentiles', '20'),
        ('tbl64', 'Table 6.4: Top-6 Relative Feature Attribution Weights Across Four ML Models', '21'),
        ('tbl65', 'Table 6.5: End-to-End 40-Check Deployment Verification Audit Summary', '21'),
        ('tbl66', 'Table 6.6: Seeded Verified Emission Factors & Statutory Export Verification', '22'),
        ('tbl67', 'Table 6.7: Live FastAPI Inference Scenario Sensitivity Evaluation', '22'),
        ('tbl68', 'Table 6.8: Production Vite Build & Live PostgreSQL Database Snapshot', '23'),
        ('tbl69', 'Table 6.9: Verified Mitigation Recommendations & Batch Import Ingestion Summary', '23'),
        ('tbl81', 'Table 8.1: Objective-to-Implementation & Verification Traceability Matrix', '26'),
        ('tbl82', 'Table 8.2: Phased Future Enhancement Roadmap for IPRC CarbonTrack', '27'),
    ]
    story.append(make_toc_table(tbl_entries, tracker_ref.get('tables', {}), st, is_lof=True))
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 1: INTRODUCTION (Body Pages 1–4)
    # =========================================================================
    story.append(Marker('chapters', 'ch1'))
    story.append(Paragraph('CHAPTER 1: INTRODUCTION', st['chapter']))

    story.append(Paragraph('1.1 Operational Background and Sustainability Imperative', st['h2']))
    story.append(Paragraph(
        'Industrial research establishments, aerospace propulsion test centers, and continuous-utility engineering complexes consume high-density electrical power, '
        'captive diesel standby fuel, compressed gases, specialized cryogenic auxiliaries such as Liquid Nitrogen (LN2), fleet transportation, and municipal water '
        'and solid waste infrastructure. Under international environmental reporting standards\u2014including the World Resources Institute and World Business Council for '
        'Sustainable Development (WRI/WBCSD) Greenhouse Gas Protocol Corporate Accounting Standard [1] and ISO 14064-1:2018 [2]\u2014public engineering institutions must '
        'maintain transparent, verifiable, and repeatable carbon dioxide (CO2) and CO2-equivalent (CO2e) inventories segmented across direct and indirect boundaries.',
        st['body']
    ))
    story.append(Paragraph(
        'Within the operational scope of the ISRO Propulsion Complex (IPRC), Mahendragiri (Research Proposal Reference: <b>RES-IPRC-2025-003</b>), environmental '
        'governance encompasses five distinct organizational divisions modeled directly in the platform database: the <b>Propulsion Testing Facility (PTF)</b>, '
        '<b>Cryogenic Engine Plant (CEP)</b>, <b>Environmental Management Division (EMD)</b>, <b>Facility Infrastructure &amp; Utilities (FIU)</b>, and <b>Safety &amp; '
        'Quality Assurance (SQA)</b>. Coordinating activity inventories manually via static spreadsheets introduces outdated grid factors, ambiguous unit conversions, '
        'absence of role-based governance, and an inability to forecast emissions prior to operational load surges.',
        st['body']
    ))

    t11_rows = [
        ['Propulsion Testing Facility (PTF)', 'Hot-test observation stands & instrumentation', 'Scope 1 & Scope 2 (Fuel / Grid)', 'Stationary diesel & substation loads'],
        ['Cryogenic Engine Plant (CEP)', 'Upper-stage testing & propellant loading', 'Scope 2 & Scope 3 (Energy / LN2)', 'Compressors & ASU liquid nitrogen'],
        ['Environmental Management Div. (EMD)', 'Station audits, waste & ecological compliance', 'Scope 3 & Governance (All)', 'SWM disposal, factor governance, audits'],
        ['Facility Infrastructure & Utilities (FIU)', 'Substations, water plants & DG backups', 'Scope 1, 2 & 3 (Energy / Water)', 'CEA grid imports & CPHEEO water pumping'],
        ['Safety & Quality Assurance (SQA)', 'Hazmat storage & logistics verification', 'Scope 1 & Scope 3 (Transport)', 'Passenger cars, EV fleet & freight trucks'],
    ]
    add_styled_table(story, st,
                     'Table 1.1: Seeded Organizational Divisions and Emission Boundary Responsibilities (RES-IPRC-2025-003)',
                     ['IPRC Division (Code)', 'Primary Engineering Function', 'Applicable GHG Scope', 'Monitored Emission Vectors'],
                     t11_rows, [122, 128, 105, 132], 'tbl11')

    story.append(Paragraph('1.2 Dual-Mode Architectural Rationale (Mode A vs. Mode B)', st['h2']))
    story.append(Paragraph(
        'A recurring software design defect in prototype environmental dashboards is mixing normalized machine learning research datasets with raw physical meter '
        'entries in the same database table. When statistical datasets undergo Z-score standardization prior to regression training, continuous predictors shift to zero '
        'mean and unit variance, yielding negative scores whenever consumption falls below the baseline average. Without structural segregation, downstream billing or '
        'audit calculations risk multiplying negative standardized energy values by emission factors, producing non-physical negative carbon inventories.',
        st['body']
    ))
    story.append(Paragraph(
        'To guarantee mathematical and regulatory soundness, <b>IPRC CarbonTrack</b> establishes a strict <b>Dual-Mode Operational Architecture</b> across disjoint '
        'PostgreSQL schemas, REST controllers, and frontend UI disclosures:',
        st['body']
    ))
    for item in [
        '<b>Mode A \u2014 Standardized Dataset &amp; Predictive Analytics:</b> Analyzes the 10,000-observation historical and projected research baseline (<i>Preprocessed_Carbon_Footprint_Dataset.csv</i>, extensible via batch CSV import) stored in <i>dataset_records</i>. Twelve input columns contain Z-score standardized features explicitly tagged with yellow standardization notices (<i>StandardizedNotice.jsx</i>), while <i>Carbon_Emission_kgCO2</i> retains physical mass in kg CO2.',
        '<b>Mode B \u2014 Physical Operational Activity Measurement:</b> Operates over an independent relational ledger (<i>activity_records</i> and <i>emission_results</i>) logging raw physical units (kWh, Litres, km, tonne-km, kg, kL) across six categories (ENERGY, FUEL, TRANSPORTATION, WASTE, WATER, MATERIAL) and GHG Protocol scopes (Scope 1, Scope 2, Scope 3). Every record deterministically multiplies quantity by verified CEA India v19 [3], IPCC 2019 [4], BEE India [5], and CPHEEO [18] emission factors.'
    ]:
        story.append(Paragraph('\u2022 ' + item, st['bullet']))

    add_figure(story, st, 'fig1_facility.png',
               'Fig. 1: Dual-Mode GHG Accounting & Predictive Analytics Framework separating Mode A (Standardized ML) from Mode B (Physical GHG Protocol Ledger).',
               'fig1', w_inch=6.25, h_inch=3.05)

    story.append(Paragraph('1.2.1 Mode B Operational Category Specifications', st['h3']))
    story.append(Paragraph(
        'Inside the Mode B ledger implemented in <i>ActivityMonitoring.jsx</i> and backed by PostgreSQL <i>ActivityRecord</i> tables, environmental officers log '
        'physical consumption across six specialized operational categories tailored to aerospace testing and facility utilities:',
        st['body']
    ))
    for cat_desc in [
        '<b>ENERGY (Electricity / Energy):</b> Captures substation grid consumption alongside on-site solar or green renewable kWh versus non-renewable imported kWh under Scope 2 using CEA India v19 (0.820 kg CO2/kWh).',
        '<b>FUEL (Liquid &amp; Gas Fuel):</b> Tracks captive high-speed diesel (HSD), petrol, and compressed natural gas (CNG) combustion inside standby generators and stationary propulsion auxiliaries under Scope 1.',
        '<b>TRANSPORTATION (Logistics &amp; Transit):</b> Records passenger fleet transit (BEE India), electric utility vehicles (CEA Grid EV), and heavy freight logistics in tonne-km or vehicle-km across site gates.',
        '<b>WASTE &amp; WATER:</b> Quantifies municipal solid waste across RECYCLED, LANDFILL, INCINERATED, and COMPOSTED pathways alongside municipal/process water consumption, reuse, and wastewater generation in kilolitres (CPHEEO).',
        '<b>MATERIAL (Cryogenics &amp; Materials):</b> Accounts for embedded Scope 3 footprints of industrial process inputs, notably air-separation-unit Liquid Nitrogen (LN2, 0.450 kg CO2/kg) consumed in cryogenic engine conditioning.'
    ]:
        story.append(Paragraph('\u2022 ' + cat_desc, st['bullet']))

    story.append(Paragraph('1.3 Problem Statement &amp; Stakeholder Roles', st['h2']))
    story.append(Paragraph(
        'Institutional sustainability workflows require resolving four interlocking system-level gaps: (1) <i>Structural Data Segregation</i> between standardized '
        'statistical research sets and physical utility logs; (2) <i>Authoritative Factor Lineage</i> replacing ad-hoc multipliers with versioned CEA India v19 and IPCC 2019 '
        'registries; (3) <i>Role-Based Access Control (RBAC) &amp; Auditability</i> separating <b>ADMIN</b> (Head, Environmental Safety Group), <b>OFFICER</b> (Senior '
        'Environmental Officer), and <b>ANALYST</b> (Research Analyst) privileges with immutable audit logs; and (4) <i>Automated Multi-Model ML Benchmarking &amp; Statutory '
        'Exports</i> delivering leakage-free regression forecasts alongside one-click PDFKit and multi-sheet ExcelJS compliance workbooks.',
        st['body']
    ))

    story.append(Paragraph('1.4 Role-Based Stakeholder Matrix &amp; Facility Personas', st['h2']))
    story.append(Paragraph(
        'To align security boundaries with real institutional oversight across Mahendragiri, <i>backend/src/scripts/seed.js</i> initializes three distinct RBAC '
        'roles tied to department codes inside PostgreSQL: (1) <b>ADMIN</b> (seeded for Head, Environmental Safety Group, EMD), holding exclusive privileges to '
        'manage user roles, review immutable <i>AuditLog</i> histories, and invoke live ML retraining via <i>POST /api/predictions/train</i>; (2) <b>OFFICER</b> '
        '(seeded for Senior Environmental Officer, EMD), authorized to log Mode B operational activities, update emission factors, triage mitigation recommendations, '
        'and execute chunked 50 MB CSV batch imports; and (3) <b>ANALYST</b> (seeded for Data Analyst &amp; Research Scholar, PTF), granted read-only exploration over '
        'Mode A charts, Pearson correlation matrices, prediction scenarios, and PDFKit/ExcelJS compliance report downloads while blocked from administrative mutations.',
        st['body']
    ))
    t12_rows = [
        ['ADMIN (admin@iprc.gov.in)', 'Head, Environmental Safety Group (EMD)', 'Full CRUD, User Role Admin, POST /train, Audit Logs', 'Authorized (200 OK)'],
        ['OFFICER (officer@iprc.gov.in)', 'Senior Environmental Officer (EMD)', 'Mode B Activities, Factors, CSV Import, Rec. Status', 'Blocked (403 on /users)'],
        ['ANALYST (analyst@iprc.gov.in)', 'Data Analyst & Research Scholar (PTF)', 'Dashboard, Explorer, Analytics, ML Predict, Exports', 'Blocked on all mutations'],
    ]
    add_styled_table(story, st,
                     'Table 1.2: Role-Based Access Control (RBAC) Seeded Personas and Privilege Boundaries',
                     ['Seeded Account / Role', 'Organizational Designation (Dept)', 'Authorized Platform Capabilities', 'Administrative Isolation'],
                     t12_rows, [118, 128, 152, 89], 'tbl12')

    story.append(Paragraph('1.5 Primary Project Objectives', st['h2']))
    for obj in [
        '<b>Objective 1 (Three-Tier Microservice Implementation):</b> Build a decoupled stack linking React 18.3 + Vite 5.4 + Chart.js (15 views), Express 4.21 + Prisma ORM 5.22 + PostgreSQL (13 models), and Python FastAPI (Uvicorn ASGI).',
        '<b>Objective 2 (Zero-Leakage ML Benchmarking):</b> Train and compare Linear Regression, Decision Tree, Random Forest, and Gradient Boosting regressors across random 80/20 (seed=42) and chronological 80/20 splits strictly on 12 standardized predictors.',
        '<b>Objective 3 (Mode B Accounting &amp; Factor Registry):</b> Seed 10 authoritative emission factors spanning Indian grid electricity, HSD diesel, petrol, CNG, passenger/freight fleet, waste, water, and cryogenic liquid nitrogen.',
        '<b>Objective 4 (Validated Bulk CSV Ingestion):</b> Support client-side PapaParse column checking and server-side Multer streaming (up to 50 MB) with chunked 1,000-row Prisma <i>createMany()</i> persistence and <i>ImportLog</i> tracking.',
        '<b>Objective 5 (Cryptographic RBAC &amp; Statutory Reporting):</b> Enforce 10-round <i>bcryptjs</i> hashing, 7-day HS256 JWT tokens, immutable <i>AuditLog</i> events, and instant PDFKit and three-worksheet ExcelJS exports.'
    ]:
        story.append(Paragraph('\u2022 ' + obj, st['bullet']))

    story.append(Paragraph('1.6 Scope and Organization of the Report', st['h2']))
    story.append(Paragraph(
        'All architectural details, schema fields, API contracts, dataset numbers, ML benchmarks, and test results reported herein are verified directly from the '
        'live project repository. Chapter 2 surveys GHG accounting standards and carbon prediction literature. Chapter 3 audits the 10,000-row baseline dataset and '
        'its 13\u00d713 correlation structure. Chapter 4 documents the three-tier architecture, 13 Prisma models, RBAC sequences, and 15 React views. Chapter 5 presents the '
        'mathematical formulations governing Mode A and Mode B. Chapter 6 details longitudinal benchmarks, ML metrics, build stats, and 40-point audit results. '
        'Chapter 7 evaluates trade-offs and limitations, and Chapter 8 outlines conclusions and future milestones.',
        st['body']
    ))

    story.append(Paragraph('1.7 Verified Software Stack &amp; Runtime Environment', st['h2']))
    story.append(Paragraph(
        'To guarantee end-to-end reproducibility across local development and containerized cloud deployment (<i>docker-compose.yml</i>), every subsystem relies on '
        'explicitly pinned open-source dependencies listed in Table 1.3.',
        st['body']
    ))
    t13_rows = [
        ['Frontend Presentation Tier', 'React 18.3.1, Vite 5.4.21, Chart.js, Axios, PapaParse', '15 authenticated SPA views & CSV preview on port 3000'],
        ['Backend API & Persistence Tier', 'Node.js, Express 4.21.1, Prisma ORM 5.22.0, PostgreSQL 15', '10 mounted REST prefixes, 13 DB models, port 5000'],
        ['Security & Export Libraries', 'bcryptjs 2.4.3, jsonwebtoken 9.0.2, PDFKit 0.15.1, ExcelJS 4.4.0', 'HS256 RBAC guards & statutory PDF/XLSX generators'],
        ['Machine Learning Microservice', 'Python 3.12, FastAPI, Uvicorn, Scikit-Learn, Pandas, Joblib', '4 benchmarked regressors & inference API on port 8000'],
    ]
    add_styled_table(story, st,
                     'Table 1.3: Verified Software Dependencies and Runtime Service Allocation Across IPRC CarbonTrack',
                     ['Architecture Tier', 'Verified Packages & Frameworks', 'Operational Role & Service Port'],
                     t13_rows, [120, 192, 175], 'tbl13')
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 2: LITERATURE REVIEW (Body Pages 5–7)
    # =========================================================================
    story.append(Marker('chapters', 'ch2'))
    story.append(Paragraph('CHAPTER 2: LITERATURE REVIEW', st['chapter']))

    story.append(Paragraph('2.1 Standardized Organizational GHG Accounting Frameworks', st['h2']))
    story.append(Paragraph(
        'Modern organizational carbon reporting rests upon two complementary international standards: the WRI/WBCSD Greenhouse Gas Protocol Corporate Accounting and '
        'Reporting Standard [1] and ISO 14064-1:2018 [2]. Both classify emissions across three mutually exclusive boundaries to prevent double counting: <b>Scope 1</b> '
        'encompasses direct combustion from organization-owned boilers, standby generators, test-stand auxiliaries, and fleet vehicles; <b>Scope 2</b> covers indirect '
        'emissions from purchased grid electricity, heat, or steam; and <b>Scope 3</b> aggregates upstream and downstream value-chain emissions including municipal solid '
        'waste disposal, potable water supply pumping, employee commuting, and industrial supply inputs such as air-separation-unit Liquid Nitrogen.',
        st['body']
    ))
    story.append(Paragraph(
        'According to the IPCC 2019 Refinement to the 2006 Guidelines for National GHG Inventories [4], Tier 1 estimation multiplies physical consumption records by '
        'default calorific/stoichiometric emission factors, whereas Tier 2 incorporates country- or facility-specific emission factors alongside non-CO2 equivalence '
        'multipliers (CH4 and N2O). Crucially, multi-site audits recommend storing explicit factor version strings and bibliographic citations alongside calculated '
        'emission results so auditors can trace every historical ledger row back to its governing standard.',
        st['body']
    ))

    story.append(Paragraph('2.2 Indian Emission Factor Inventories &amp; Sectoral Benchmarks', st['h2']))
    story.append(Paragraph(
        'Electricity emission intensity varies widely across national power grids due to differing shares of coal thermal, hydro, nuclear, and solar generation. Applying '
        'North American or European averages misstates industrial Scope 2 footprints in India by up to 40%. Consequently, Indian facilities adopt the Central Electricity '
        'Authority (CEA) <i>CO2 Baseline Database for the Indian Power Sector</i> (Version 19) [3], which publishes the combined-margin baseline factor incorporated into '
        'IPRC CarbonTrack (<b>0.82 kg CO2/kWh</b>), as well as well-to-wheel electric vehicle efficiency projections (<b>0.053 kg CO2/km</b>). Complementing CEA, the Bureau '
        'of Energy Efficiency (BEE) [5] provides passenger fleet emission factors (<b>0.171 kg CO2/km</b>), while CPHEEO municipal manuals [18] quantify urban water treatment '
        'and pumping intensity (<b>0.35 kg CO2/kL</b>).',
        st['body']
    ))

    story.append(Paragraph('2.3 Machine Learning for Carbon Footprint Forecasting', st['h2']))
    story.append(Paragraph(
        'While factor multiplication audits retrospective meter readings, forward-looking energy management requires predictive machine learning models trained on '
        'multivariate telemetry and environmental indicators [6, 9, 10]. Ordinary Least Squares (OLS) Linear Regression serves as a robust, interpretable baseline when '
        'emissions scale additively across energy demand and travel distance. Conversely, recursive partitioning methods\u2014Decision Trees, Breiman\'s Random Forests '
        '[7], and Friedman\'s Gradient Boosting Regressors [8]\u2014capture non-linear interactions across meteorological variables (temperature, humidity), appliance '
        'duty cycles, and renewable penetration ratios.',
        st['body']
    ))
    story.append(Paragraph(
        'Methodological surveys by Kaufman et al. [11] warn against two widespread evaluation errors in empirical ML pipelines: (a) <i>data/target leakage</i>, where '
        'derived cost or emission-proxy variables leak target information during fitting; and (b) relying solely on shuffled cross-validation over multi-year time-indexed '
        'records, masking temporal drift. Following best practices [11, 12], IPRC CarbonTrack restricts inputs strictly to the 12 standardized predictors and validates '
        'all four Scikit-Learn architectures across both random 80/20 (seed=42) and strict chronological 80/20 holdout splits.',
        st['body']
    ))

    story.append(Paragraph('2.4 Methodological Challenges: Leakage &amp; Temporal Evaluation', st['h2']))
    story.append(Paragraph(
        'Beyond model accuracy alone, environmental time-series datasets demand strict temporal validation discipline. When multi-year records spanning 2024\u20132051 '
        'are partitioned solely via shuffled random sampling, temporally adjacent days share quasi-identical seasonal profiles across train and test subsets, creating '
        'optimism bias. Evaluating models additionally under a strict chronological split (training on the initial 80% date window and predicting the final 20% '
        'future horizon) verifies whether learned weights remain invariant over extended multi-decade projections. Similarly, isolating Z-score standardized feature '
        'sets from downstream physical emission logs guards against silent unit corruption across statistical pipelines.',
        st['body']
    ))

    story.append(Paragraph('2.5 Enterprise Microservice Web Architectures &amp; Comparative Synthesis', st['h2']))
    story.append(Paragraph(
        'Production environmental software increasingly decouples browser interfaces from database persistence and Python statistical runtimes [13, 14, 15]. '
        'React 18 paired with Vite provides lightweight client routing and interactive Chart.js visualization; Express.js over Prisma ORM enforces SQL parameterization '
        'and RFC 7519 JWT role checks [16, 17]; and FastAPI exposes typed Pydantic inference endpoints over serialized <i>.joblib</i> pipelines. Table 2.1 benchmarks '
        'these architectural paradigms against existing tracking tools.',
        st['body']
    ))

    story.append(Paragraph('2.5.1 Linear Additive vs. Non-Linear Ensemble Modeling Trade-offs', st['h3']))
    story.append(Paragraph(
        'In tabular sustainability modeling, practitioner studies frequently default to complex tree ensembles or deep networks without verifying whether underlying '
        'physical drivers behave additively [6, 9, 10]. As Hastie et al. [6] establish, when target response surfaces are predominantly linear combinations of primary '
        'predictors (such as grid power draw and fleet haulage distance), Ordinary Least Squares achieves minimum-variance unbiased estimation, whereas axis-aligned '
        'Decision Trees [7, 8] introduce step-wise quantization variance along diagonal hyperplanes. Benchmarking Linear Regression alongside Decision Tree, '
        'Random Forest, and Gradient Boosting within a unified automated registry guarantees empirical rigor rather than assuming non-linear superiority a priori.',
        st['body']
    ))
    story.append(Paragraph(
        'From an enterprise software perspective, modern microservice designs pair strongly typed Object-Relational Mapping (Prisma ORM [17]) with decoupled ML '
        'inference containers (FastAPI [13]) so model retraining or Python runtime upgrades never interrupt transactional activity logging, audit recording, or PDF/Excel '
        'compliance export delivery in the Node.js API tier [14, 15, 16].',
        st['body']
    ))

    t21_rows = [
        ['Manual Spreadsheet Inventories', 'Scope 1/2/3 manual formulas', 'Absent', 'File-level OS permissions only', 'Stale emission factors & human copy errors'],
        ['Standalone Python ML Notebooks', 'No transactional activity ledger', 'Scikit-Learn / XGBoost offline', 'None (single-analyst script)', 'No live RBAC web portal or PDF/Excel exports'],
        ['Generic BI Dashboards (PowerBI)', 'Static warehouse snapshots', 'Limited external scripting', 'Viewer/Editor workspace roles', 'No Mode A Z-score safeguard or auto-calc API'],
        ['Legacy Monolithic Web Calculators', 'Basic Tier 1 form entry', 'Heuristic averages only', 'Session auth without AuditLog', 'Lacks CEA v19/IPCC lineage & ML prediction'],
        ['Proposed IPRC CarbonTrack Platform', 'Dual Mode A (ML) + Mode B (CEA/IPCC)', '4 Live FastAPI Regressors (.joblib)', 'HS256 JWT + 3-Role RBAC + AuditLog', 'Full-stack DB, Batch CSV & PDFKit/ExcelJS'],
    ]
    add_styled_table(story, st,
                     'Table 2.1: Comparative Review of Organizational GHG Accounting and Prediction Approaches [1, 4, 9, 12]',
                     ['Approach / System Class', 'Accounting Scope', 'Predictive Intelligence', 'Security & Auditability', 'Key Limitation / Gap Addressed'],
                     t21_rows, [105, 95, 95, 95, 97], 'tbl21', summary_last=True)

    story.append(Paragraph(
        'Taken together, existing tools isolate GHG ledger accounting, leakage-free machine learning benchmarking, and statutory document generation into disconnected '
        'workflows. IPRC CarbonTrack unifies all three dimensions inside an auditable, role-segregated three-tier web platform tailored for IPRC engineering divisions.',
        st['body']
    ))

    story.append(Paragraph('2.6 Critical Synthesis of Identified Research Gaps', st['h2']))
    story.append(Paragraph(
        'Synthesizing standards [1, 2, 3, 4] alongside statistical learning theory [6, 7, 8, 11] and microservice engineering references [13, 14, 15, 16, 17] reveals '
        'four concrete architectural requirements satisfied by the proposed implementation:',
        st['body']
    ))
    for gap_pt in [
        '<b>Gap 1 — Mixed Scale Corruption:</b> Unseparated dashboards risk applying emission factors to Z-score standardized features. Isolating Mode A (<i>dataset_records</i>) from Mode B (<i>activity_records</i>) eliminates negative or scale-corrupted accounting entries.',
        '<b>Gap 2 — Unverified Emission Multipliers:</b> Generic western calculators diverge from Indian grid mix. Persisting CEA v19, IPCC 2019, BEE, CPHEEO, and IGA metadata directly inside <i>emission_factors</i> establishes cryptographic source traceability.',
        '<b>Gap 3 — Chronological Overfitting in Carbon Forecasts:</b> Evaluating regressors solely on shuffled splits masks temporal drift. Adding an 80/20 date-ordered holdout alongside random evaluation validates multi-decade invariance across 2024\u20132051.',
        '<b>Gap 4 — Audit &amp; Document Silos:</b> Offline Python notebooks lack RBAC governance and compliance exports. Pairing HS256 JWT roles with automated PDFKit and 3-sheet ExcelJS streams turns analytical telemetry into submission-ready records.'
    ]:
        story.append(Paragraph('\u2022 ' + gap_pt, st['bullet']))

    story.append(Paragraph(
        'Addressing all four gaps concurrently differentiates IPRC CarbonTrack from single-tier student calculators. Specifically, maintaining disjoint Mode A and Mode B '
        'ledgers ensures analytical machine learning experiments never compromise statutory GHG accounting records, while standardized Indian multipliers enable repeatable '
        'division-level compliance across propulsion testing and facility utilities [1, 3, 18].',
        st['body']
    ))
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 3: DATASET AND PREPROCESSING (Body Pages 8–10)
    # =========================================================================
    story.append(Marker('chapters', 'ch3'))
    story.append(Paragraph('CHAPTER 3: DATASET AND PREPROCESSING', st['chapter']))

    story.append(Paragraph('3.1 Research Baseline Dataset Inventory', st['h2']))
    story.append(Paragraph(
        'Mode A exploratory analytics and predictive modeling operate over <i>data/Preprocessed_Carbon_Footprint_Dataset.csv</i>. Programmatic verification via Pandas '
        'confirms exact baseline dimensions of <b>10,000 rows \u00d7 14 columns</b>, continuous daily dates spanning <b>2024-01-01 to 2051-05-18</b>, <b>0 missing '
        '(NaN/null) cells</b>, and <b>0 duplicate rows</b>. Furthermore, during end-to-end validation of the web upload workflow using synthetic dataset '
        '<i>Carbon_Footprint_Synthetic_Test_Dataset_100.csv</i>, two validated 100-row batches were persisted through <i>POST /api/dataset/import</i>, expanding the live '
        'PostgreSQL <i>dataset_records</i> table to <b>10,200 rows</b> while keeping offline model benchmarking pinned cleanly to the 10,000-row baseline CSV.',
        st['body']
    ))

    story.append(Paragraph('3.2 Z-Score Standardization Disclosure and Schema Audit', st['h2']))
    story.append(Paragraph(
        'Twelve independent numeric predictors in the baseline dataset are <b>Z-score standardized</b> (empirical mean = 0.0000, sample standard deviation = 1.0001 '
        'across n = 10,000), while the 14th target column <b>Carbon_Emission_kgCO2</b> preserves physical unstandardized mass in kilograms of CO2: mean = <b>22.9560 kg CO2</b>, '
        'standard deviation = <b>9.7383 kg CO2</b>, minimum = <b>1.1868 kg CO2</b>, 25th percentile = <b>15.7345 kg CO2</b>, median = <b>22.6234 kg CO2</b>, '
        '75th percentile = <b>29.5339 kg CO2</b>, and maximum = <b>55.9616 kg CO2</b>. Table 3.1 documents every schema column verified from both CSV statistics and '
        '<i>datasetController.js</i> (`DATA_DICTIONARY`).',
        st['body']
    ))

    t31_rows = [
        ['Date', 'Temporal Index', '2024-01-01 to 2051-05-18', '\u2014 (0 nulls)', '\u2014'],
        ['Energy_Usage_kWh', 'Z-Score Predictor', '-1.7181 to +1.7578', '0.0000 \u00b1 1.0001', '+0.7048'],
        ['Transportation_Distance_km', 'Z-Score Predictor', '-1.7435 to +1.7125', '0.0000 \u00b1 1.0001', '+0.5897'],
        ['Renewable_Energy_Usage_percent', 'Z-Score Predictor', '-1.7191 to +1.7354', '0.0000 \u00b1 1.0001', '+0.0102'],
        ['Vehicle_Type_Walking', 'Standardized Binary', '-0.5747 to +1.7399', '0.0000 \u00b1 1.0001', '+0.0078'],
        ['Fuel_Usage_Liters', 'Z-Score Predictor', '-1.7250 to +1.7321', '0.0000 \u00b1 1.0001', '+0.0067'],
        ['Vehicle_Type_Car', 'Standardized Binary', '-0.5920 to +1.6892', '0.0000 \u00b1 1.0001', '+0.0014'],
        ['Humidity_percent', 'Z-Score Predictor', '-1.7435 to +1.7310', '0.0000 \u00b1 1.0001', '+0.0009'],
        ['Temperature_C', 'Z-Score Predictor', '-1.7450 to +1.7230', '0.0000 \u00b1 1.0001', '-0.0078'],
        ['Waste_Generated_kg', 'Z-Score Predictor', '-1.7370 to +1.7413', '0.0000 \u00b1 1.0001', '-0.0088'],
        ['Vehicle_Type_Electric Vehicle', 'Standardized Binary', '-0.5777 to +1.7311', '0.0000 \u00b1 1.0001', '-0.0099'],
        ['Building_Type_Residential', 'Standardized Binary', '-0.9950 to +1.0050', '0.0000 \u00b1 1.0001', '-0.0126'],
        ['Smart_Appliance_Usage_hours', 'Z-Score Predictor', '-1.7314 to +1.7588', '0.0000 \u00b1 1.0001', '-0.0131'],
        ['Carbon_Emission_kgCO2', 'Physical Target (kg CO2)', '1.1868 to 55.9616', '22.9560 \u00b1 9.7383', '1.0000 (Target)'],
    ]
    add_styled_table(story, st,
                     'Table 3.1: Verified Statistical Audit of All 14 Columns in Preprocessed_Carbon_Footprint_Dataset.csv (n = 10,000)',
                     ['Column Name', 'Statistical Nature', 'Observed Min \u2013 Max', 'Mean \u00b1 Std Dev', 'Target Pearson r'],
                     t31_rows, [142, 95, 98, 82, 70], 'tbl31', summary_last=True)

    add_figure(story, st, 'fig5_distribution.png',
               'Fig. 2: Observed frequency histogram (Panel A) and residential vs. commercial box distribution (Panel B) of physical target Carbon_Emission_kgCO2 (n = 10,000).',
               'fig5', w_inch=6.25, h_inch=2.45)

    story.append(Paragraph('3.3 Multivariate Correlation Structure and Stratified Breakdowns', st['h2']))
    story.append(Paragraph(
        'Computing the full 13\u00d713 Pearson correlation matrix (Fig. 3) reveals that <b>Energy_Usage_kWh</b> (r = +0.7048) and <b>Transportation_Distance_km</b> '
        '(r = +0.5897) act as the two primary orthogonal drivers of daily carbon emissions (Fig. 4). Continuous predictors show near-zero cross-correlation, avoiding '
        'multicollinearity distortion, whereas the mild negative off-diagonal cluster across <i>Car</i>, <i>EV</i>, and <i>Walking</i> reflects standardized one-hot '
        'exclusivity against the omitted public-transit reference level.',
        st['body']
    ))

    add_figure(story, st, 'fig6_correlation.png',
               'Fig. 3: Full 13\u00d713 Pearson correlation heatmap (Panel A) and ranked predictor correlations against Carbon_Emission_kgCO2 (Panel B).',
               'fig6', w_inch=6.25, h_inch=2.55)

    add_figure(story, st, 'fig7_scatter_drivers.png',
               'Fig. 4: Empirical scatter and OLS trendlines showing linear dependence of Carbon_Emission_kgCO2 on standardized energy usage (r = +0.705) and transport distance (r = +0.590).',
               'fig7', w_inch=6.25, h_inch=2.40)

    t32_rows = [
        ['Transport: Passenger Car (Z > 0)', '2,595', '22.9788 kg', '59,630.04 kg CO2'],
        ['Transport: Electric Vehicle (Z > 0)', '2,502', '22.7893 kg', '57,018.84 kg CO2'],
        ['Transport: Walking / Non-Motorized (Z > 0)', '2,483', '23.0876 kg', '57,326.61 kg CO2'],
        ['Transport: Public / Other Reference (Z \u2264 0)', '2,420', '22.9688 kg', '55,584.38 kg CO2'],
        ['Building: Residential (Z > 0) vs. Commercial (Z \u2264 0)', '4,975 / 5,025', '22.8329 / 23.0778 kg', 'Total: 229,559.86 kg'],
        ['Renewable Quartiles (Q1 / Q2 / Q3 / Q4)', '3,088 / 1,941 / 1,936 / 3,035', '22.83 / 22.92 / 23.08 / 23.03', 'r = +0.0102 vs. Target'],
    ]
    add_styled_table(story, st,
                     'Table 3.2: Observed Vehicle Mode, Building Sector, and Renewable Quartile Breakdown (Preprocessed CSV, n = 10,000)',
                     ['Cohort Stratum', 'Observation Count', 'Mean Carbon Emission', 'Aggregate / Comparative Note'],
                     t32_rows, [175, 92, 108, 112], 'tbl32')

    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 4: SYSTEM DESIGN AND METHODOLOGY (Body Pages 11–14)
    # =========================================================================
    story.append(Marker('chapters', 'ch4'))
    story.append(Paragraph('CHAPTER 4: SYSTEM DESIGN AND METHODOLOGY', st['chapter']))

    story.append(Paragraph('4.1 Decoupled Three-Tier Microservice Architecture', st['h2']))
    story.append(Paragraph(
        'IPRC CarbonTrack implements a three-tier microservice topology orchestratable natively or via <i>docker-compose.yml</i>. The <b>Presentation Tier</b> '
        '(React 18.3, Vite 5.4, Tailwind CSS 3.4, Chart.js 4.4) serves interactive analytics on port 3000; the <b>Application Tier</b> (Node.js + Express 4.21) '
        'coordinates REST routing, JWT RBAC authorization, batch CSV validation, and PDFKit/ExcelJS exports on port 5000; and the <b>Data &amp; Intelligence Tier</b> '
        'couples PostgreSQL (via Prisma ORM 5.22) with a dedicated Python FastAPI microservice on port 8000 hosting trained Scikit-Learn estimators.',
        st['body']
    ))

    add_figure(story, st, 'fig2_architecture.png',
               'Fig. 5: Decoupled Three-Tier Enterprise Microservice Architecture connecting React SPA, Express/Prisma API, PostgreSQL, and FastAPI ML Engine.',
               'fig2', w_inch=6.25, h_inch=2.85)

    story.append(Paragraph('4.2 Relational PostgreSQL Schema and REST API Endpoints', st['h2']))
    story.append(Paragraph(
        'The database schema in <i>backend/prisma/schema.prisma</i> defines <b>13 relational models</b> and <b>8 enumerations</b>. Transactional models '
        '(<i>User</i>, <i>Department</i>, <i>ActivityRecord</i>, <i>EmissionFactor</i>, <i>EmissionResult</i>, <i>PredictionHistory</i>, <i>AuditLog</i>, '
        '<i>ImportLog</i>) employ UUID primary keys, while <i>DatasetRecord</i> uses indexed integer keys alongside composite B-tree indexes on <i>date</i> and '
        '<i>datasetId</i>. Specialized domain tables (<i>RenewableEnergyRecord</i>, <i>WaterRecord</i>, <i>WasteRecord</i>, <i>MaterialRecord</i>) and '
        '<i>Recommendation</i> governance models complete the schema (Fig. 6, Table 4.1).',
        st['body']
    ))

    add_figure(story, st, 'fig3_erd.png',
               'Fig. 6: Normalized PostgreSQL Entity-Relationship Schema illustrating key Prisma models and one-to-many foreign key constraints.',
               'fig3', w_inch=6.25, h_inch=2.95)

    t41_rows = [
        ['/api/auth/*', 'User, Department, AuditLog', 'Public + Protected (/me)', 'Login, Registration, Department List, Profile'],
        ['/api/dashboard/*', 'DatasetRecord, ActivityRecord', 'Any Valid JWT', 'Filtered KPIs, Yearly/Monthly Trends, Breakdowns'],
        ['/api/dataset/*', 'DatasetRecord, UploadedDataset, ImportLog', 'JWT; Import: ADMIN/OFFICER', '14-Col Dictionary, Paginated Query, 50MB CSV Import'],
        ['/api/analytics/*', 'DatasetRecord', 'Any Valid JWT', '13x13 Pearson Matrix, Scatter Samples, Clean Quartiles'],
        ['/api/activities/*', 'ActivityRecord, EmissionResult, AuditLog', 'Write: ADMIN/OFFICER; Del: ADMIN', 'Mode B Activity CRUD & Auto Factor Multiplication'],
        ['/api/emission-factors/*', 'EmissionFactor', 'Mutate: ADMIN/OFFICER', 'Verified CEA/IPCC Factor Registry Management'],
        ['/api/predictions/*', 'PredictionHistory, ModelMetadata', 'Train: ADMIN Only', 'FastAPI Model List, Inference, Retraining Trigger'],
        ['/api/recommendations/*', 'Recommendation', 'Mutate: ADMIN/OFFICER', 'Mitigation Recommendations & Status Tracking'],
        ['/api/reports/*', 'DatasetRecord, ActivityRecord, EmissionFactor', 'Any Valid JWT (?token supported)', 'Summary JSON, PDFKit Audit PDF, 3-Sheet ExcelJS'],
        ['/api/users/*', 'User, AuditLog', 'ADMIN Only', 'User Roster Governance & Immutable Audit Trail'],
    ]
    add_styled_table(story, st,
                     'Table 4.1: Mounted Express REST API Route Groups, Prisma Models, and RBAC Authorization Policies',
                     ['Route Prefix', 'Primary Prisma Models', 'RBAC Policy', 'Implemented Functional Capability'],
                     t41_rows, [92, 128, 102, 165], 'tbl41')

    story.append(Paragraph('4.3 Cryptographic Security, RBAC &amp; Mode B Accounting Pipeline', st['h2']))
    story.append(Paragraph(
        'Figure 7 details the JWT security sequence inside <i>authController.js</i> and <i>middleware/auth.js</i>. User passwords undergo 10-round <i>bcryptjs</i> '
        'verification prior to signing HS256 JWT tokens with 7-day validity. Middleware inspects Bearer Authorization headers (or <i>?token=</i> query parameters for '
        'direct statutory report downloads) and enforces strict role gates across <b>ADMIN</b>, <b>OFFICER</b>, and <b>ANALYST</b> accounts. Figure 8 illustrates the '
        'Mode B activity pipeline that resolves an active <i>EmissionFactor</i> and commits physical CO2 and CO2e totals atomically.',
        st['body']
    ))

    add_figure(story, st, 'fig4_auth_flow.png',
               'Fig. 7: Sequence flow for bcryptjs verification, HS256 JWT issuance, RBAC enforcement, and ML service delegation.',
               'fig4', w_inch=6.25, h_inch=2.60)

    add_figure(story, st, 'fig8_modeb_workflow.png',
               'Fig. 8: Mode B operational activity-to-CO2 calculation pipeline and 10 seeded authoritative emission factors across six categories.',
               'fig8', w_inch=6.25, h_inch=2.45)

    story.append(Paragraph('4.4 Batch CSV Ingestion, Export Pipeline &amp; Frontend Module Map', st['h2']))
    story.append(Paragraph(
        'As summarized in Fig. 9 and Table 4.2, <i>DataImport.jsx</i> validates 14 expected headers client-side via PapaParse before posting buffers up to 50 MB via '
        'Multer memory storage to <i>datasetController.js</i>, which persists batches of 1,000 rows via Prisma <i>createMany()</i>. All 15 routed pages in <i>App.jsx</i> '
        'connect to Express endpoints via Axios interceptors handling automatic token injection and 401 session redirects.',
        st['body']
    ))

    add_figure(story, st, 'fig12_ingestion_pipeline.png',
               'Fig. 9: Validated batch CSV ingestion workflow (PapaParse + Multer + chunked createMany) and statutory PDFKit/ExcelJS export pipeline.',
               'fig12', w_inch=6.25, h_inch=2.45)

    t42_rows = [
        ['/overview', 'Overview.jsx', 'KPI Cards, Year/Vehicle/Building Filters, Chart.js Trends & Histogram'],
        ['/dataset-explorer & /import', 'DatasetExplorer.jsx, DataImport.jsx', 'Paginated 14-Col Table, Data Dictionary, 50MB Chunked CSV Upload'],
        ['/activity-monitoring', 'ActivityMonitoring.jsx', 'Mode B 6-Category Physical Activity Entry, Scope Breakdown & CRUD'],
        ['/energy, /fuel, /transportation, /waste, /renewable-energy', 'Domain Analytics Pages (5)', 'Sector-wise Charts, Scatter Plots, & Renewable Clean Quartile Views'],
        ['/carbon-analytics & /prediction', 'CarbonEmissionAnalytics.jsx, PredictionInsights.jsx', '13x13 Correlation Matrix, FastAPI Model Benchmarks & Live Prediction'],
        ['/recommendations, /reports, /users, /settings', 'Governance & Export Views (4)', 'Mitigation Status, PDFKit/ExcelJS Exports, ADMIN Audit Logs & Config'],
    ]
    add_styled_table(story, st,
                     'Table 4.2: Implemented React 18 SPA Routes Mapped to Frontend Components and Backend Capabilities',
                     ['Route Path(s)', 'Source Component(s)', 'Core Functional Implementation'],
                     t42_rows, [132, 138, 217], 'tbl42')

    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 5: MATHEMATICAL FORMULATION (Body Pages 15–17)
    # =========================================================================
    story.append(Marker('chapters', 'ch5'))
    story.append(Paragraph('CHAPTER 5: MATHEMATICAL FORMULATION', st['chapter']))

    story.append(Paragraph('5.1 Mode A Z-Score Feature Standardization', st['h2']))
    story.append(Paragraph(
        'Every continuous predictor x<sub>i,j</sub> across the 12 feature dimensions in Mode A is normalized relative to its baseline cohort mean '
        '\u03bc<sub>j</sub> and standard deviation \u03c3<sub>j</sub> via zero-mean unit-variance Z-score transformation:',
        st['body']
    ))
    story.append(Paragraph('z<sub>i,j</sub> = (x<sub>i,j</sub> \u2212 \u03bc<sub>j</sub>) / \u03c3<sub>j</sub>   \u21d2   E[z<sub>\u00b7,j</sub>] = 0,   Std(z<sub>\u00b7,j</sub>) \u2248 1', st['eq']))
    story.append(Paragraph(
        'Because standardization centers each predictor around zero, negative values z<sub>i,j</sub> &lt; 0 indicate below-average consumption relative to the cohort, '
        'never negative physical flow. In contrast, target mass y<sub>i</sub> = Carbon_Emission_kgCO2 remains unstandardized in physical kilograms of CO2.',
        st['body']
    ))

    story.append(Paragraph('5.2 Mode B Deterministic GHG Accounting &amp; Worked Facility Calculation', st['h2']))
    story.append(Paragraph(
        'For any Mode B operational record r with physical activity quantity Q<sub>r</sub> linked to active emission factor EF<sub>k</sub> and radiative equivalence '
        'multiplier M<sub>k</sub>, <i>activityController.js</i> computes both direct CO2 and total CO2-equivalent emissions:',
        st['body']
    ))
    story.append(Paragraph('E<sub>CO2,r</sub> = Q<sub>r</sub> \u00d7 EF<sub>k</sub> ,      E<sub>CO2e,r</sub> = E<sub>CO2,r</sub> \u00d7 M<sub>k</sub>', st['eq']))
    story.append(Paragraph(
        'Facility-wide statutory totals aggregate records across GHG Protocol boundaries S \u2208 {SCOPE_1, SCOPE_2, SCOPE_3} and across IPRC departments:',
        st['body']
    ))
    story.append(Paragraph('E<sub>total</sub>(S) = \u03a3<sub>r \u2208 S</sub> E<sub>CO2,r</sub> ,      E<sub>campus</sub> = E<sub>total</sub>(Scope 1) + E<sub>total</sub>(Scope 2) + E<sub>total</sub>(Scope 3)', st['eq']))
    story.append(Paragraph(
        '<i>Verified Facility Numerical Example (from testSuite.js &amp; comprehensiveDeploymentAudit.js):</i> Logging Q = 2,000 kWh of Scope 2 electricity under CEA '
        'India Baseline v19 (EF = 0.82 kg CO2/kWh, M = 1.00) yields E<sub>CO2</sub> = 2,000 \u00d7 0.82 = <b>1,640.0 kg CO2</b>. Similarly, updating a 5,000 kWh test '
        'entry (4,100.0 kg CO2) to 6,000 kWh deterministically recomputes E<sub>CO2</sub> = <b>4,920.0 kg CO2</b> and updates the corresponding <i>EmissionResult</i> record.',
        st['body']
    ))

    story.append(Paragraph('5.3 Pearson Correlation &amp; Clean Energy Quartile Partitioning', st['h2']))
    story.append(Paragraph(
        'In <i>analyticsController.js</i>, pairwise linear dependence across N observations (N = 2,000 in runtime API; N = 10,000 in full CSV analysis) is quantified '
        'via the sample Pearson product-moment correlation coefficient r(X, Y):',
        st['body']
    ))
    story.append(Paragraph('r(X, Y) = [ N \u03a3 x<sub>i</sub>y<sub>i</sub> \u2212 (\u03a3 x<sub>i</sub>)(\u03a3 y<sub>i</sub>) ] / \u221a[ (N \u03a3 x<sub>i</sub><super>2</super> \u2212 (\u03a3 x<sub>i</sub>)<super>2</super>) (N \u03a3 y<sub>i</sub><super>2</super> \u2212 (\u03a3 y<sub>i</sub>)<super>2</super>) ]', st['eq']))
    story.append(Paragraph(
        'Furthermore, <i>getRenewableAnalytics</i> stratifies standardized renewable utilization Z<sub>ren</sub> into four standard normal quartile intervals\u2014Q1 '
        '(Z &lt; -0.67), Q2 (-0.67 \u2264 Z &lt; 0), Q3 (0 \u2264 Z &lt; 0.67), and Q4 (Z \u2265 0.67)\u2014aggregating mean CO2 intensity inside PostgreSQL.',
        st['body']
    ))

    story.append(Paragraph('5.4 Predictive Regression Formulations (Mode A ML Engine)', st['h2']))
    story.append(Paragraph(
        'Given 12-dimensional standardized input vector <b>z</b><sub>i</sub> \u2208 R<super>12</super>, <i>train_models.py</i> evaluates four regression architectures '
        'without derived target leakage:',
        st['body']
    ))
    story.append(Paragraph(
        '<b>1. Ordinary Least Squares Linear Regression:</b> Estimates intercept \u03b2<sub>0</sub> and linear weights <b>w</b> \u2208 R<super>12</super> minimizing '
        'L2 prediction residuals; normalized feature attribution weight I<sub>j</sub> reflects fractional coefficient magnitude:',
        st['body']
    ))
    story.append(Paragraph('<i>y</i><sub>pred,i</sub> = \u03b2<sub>0</sub> + <b>w</b><super>T</super><b>z</b><sub>i</sub> ,     min<sub>\u03b20,w</sub> \u03a3<sub>i=1..n</sub> (<i>y</i><sub>i</sub> \u2212 <i>y</i><sub>pred,i</sub>)<super>2</super> ,     I<sub>j</sub> = |w<sub>j</sub>| / \u03a3<sub>m=1..12</sub> |w<sub>m</sub>|', st['eq']))
    story.append(Paragraph(
        '<b>2. Decision Tree &amp; Random Forest Regressors:</b> Decision Tree (<i>max_depth = 8</i>) recursively partitions feature space at split (j, s) maximizing '
        'intra-node mean squared error reduction \u0394MSE. Random Forest averages B = 100 decorrelated bootstrap trees (<i>max_depth = 12</i>) to stabilize leaf variance:',
        st['body']
    ))
    story.append(Paragraph('<i>y</i><sub>RF</sub>(<b>z</b>) = (1 / B) \u03a3<sub>b=1..B</sub> T<sub>b</sub>(<b>z</b>) ,     \u0394MSE = MSE(parent) \u2212 [ (n<sub>L</sub>/n)MSE<sub>L</sub> + (n<sub>R</sub>/n)MSE<sub>R</sub> ]', st['eq']))
    story.append(Paragraph(
        '<b>3. Gradient Boosting Regressor:</b> Constructs an additive sequence of M = 150 shallow trees (<i>learning_rate \u03b7 = 0.08, max_depth = 5</i>), fitting '
        'each tree h<sub>m</sub> to negative squared-error pseudo-residuals r<sub>i,m</sub>:',
        st['body']
    ))
    story.append(Paragraph('F<sub>m</sub>(<b>z</b>) = F<sub>m\u22121</sub>(<b>z</b>) + \u03b7 \u00b7 h<sub>m</sub>(<b>z</b>) ,     r<sub>i,m</sub> = <i>y</i><sub>i</sub> \u2212 F<sub>m\u22121</sub>(<b>z</b><sub>i</sub>)', st['eq']))

    story.append(Paragraph('5.5 Dual-Split Partitioning, Error Metrics &amp; Clamped Inference', st['h2']))
    story.append(Paragraph(
        'To test both isotropic generalization and temporal stability, each model is evaluated across two disjoint splits: (a) a reproducible random 80/20 split '
        '(n<sub>train</sub> = 8,000, n<sub>test</sub> = 2,000, <i>random_state = 42</i>), and (b) a chronological date-sorted split assigning the earliest 8,000 dates to '
        'training and the latest 2,000 dates to holdout validation. Performance is reported via R<super>2</super>, MAE, MSE, and RMSE:',
        st['body']
    ))
    story.append(Paragraph('R<super>2</super> = 1 \u2212 [\u03a3 (<i>y</i><sub>i</sub> \u2212 <i>y</i><sub>pred,i</sub>)<super>2</super> / \u03a3 (<i>y</i><sub>i</sub> \u2212 <i>y</i><sub>mean</sub>)<super>2</super>] ,    MAE = (1/n)\u03a3|<i>y</i><sub>i</sub> \u2212 <i>y</i><sub>pred,i</sub>| ,    RMSE = \u221a[ (1/n)\u03a3(<i>y</i><sub>i</sub> \u2212 <i>y</i><sub>pred,i</sub>)<super>2</super> ]', st['eq']))
    story.append(Paragraph(
        'During FastAPI inference (<i>POST /predict</i> in <i>ml-service/app.py</i>), predicted emissions are non-negativity clamped via '
        '<i>y</i><sub>out</sub> = max(0.0, round(<i>y</i><sub>pred</sub>, 3)) and accompanied by feature-wise contribution scores c<sub>j</sub> = round(10.0 \u00d7 z<sub>j</sub> \u00d7 I<sub>j</sub>, 3) '
        'persisted directly inside PostgreSQL <i>PredictionHistory</i>.',
        st['body']
    ))

    story.append(Paragraph('5.6 Algorithmic Procedures &amp; Computational Complexity', st['h2']))
    story.append(Paragraph(
        'The end-to-end execution in <i>train_models.py</i> proceeds deterministically through six reproducible stages: (1) load CSV and parse ISO dates; '
        '(2) construct 80/20 random split (seed=42) alongside date-sorted 80/20 chronological split; (3) fit OLS Linear Regression, DecisionTreeRegressor(max_depth=8), '
        'RandomForestRegressor(n_estimators=100, max_depth=12), and GradientBoostingRegressor(n_estimators=150, lr=0.08, max_depth=5); (4) evaluate test R<super>2</super>, '
        'MAE, MSE, RMSE, and chronological counterparts; (5) extract normalized feature weights and persist individual <i>.joblib</i> artifacts; and (6) promote the '
        'highest-R<super>2</super> estimator to <i>active_model.joblib</i> alongside <i>models_metadata.json</i>.',
        st['body']
    ))
    story.append(Paragraph(
        'Computationally, runtime Pearson correlation over d = 13 fields and N = 2,000 sampled records executes in O(N \u00b7 d<super>2</super>) time in Node.js, '
        'completing within a single sub-50 ms request cycle, while chunked CSV batch insertion amortizes PostgreSQL round-trips via O(ceil(M / 1000)) Prisma '
        '<i>createMany()</i> transactions for M uploaded rows. Table 5.1 summarizes the exact estimator hyperparameters configured in <i>train_models.py</i> alongside '
        'Mode B category-level relational side-tables populated during operational ingestion.',
        st['body']
    ))

    t51_rows = [
        ['Linear Regression (OLS)', 'Default (fit_intercept=True, 12 Z features)', 'O(p^2 n) closed-form / SVD solver; promotes weights w_j'],
        ['Decision Tree Regressor', 'max_depth=8, random_state=42', 'Single axis-aligned MSE-reduction regression tree'],
        ['Random Forest Regressor', 'n_estimators=100, max_depth=12, seed=42', 'Bootstrap aggregation over 100 decorrelated depth-12 trees'],
        ['Gradient Boosting Regressor', 'n_estimators=150, lr=0.08, max_depth=5', 'Additive forward stagewise shrinkage over squared residuals'],
        ['Mode B ENERGY / WATER / WASTE', 'Primary EmissionResult + typed child tables', 'Persists RenewableEnergyRecord, WaterRecord, WasteRecord, MaterialRecord'],
    ]
    add_styled_table(story, st,
                     'Table 5.1: ML Training Hyperparameters and Mode B Domain Side-Table Persistence Specifications',
                     ['Pipeline Component / Model', 'Verified Configuration / Parameters', 'Mathematical / Persistence Behavior'],
                     t51_rows, [135, 165, 187], 'tbl51')

    story.append(Paragraph('5.7 Audit Event Serialization &amp; Statutory Report Summation Logic', st['h2']))
    story.append(Paragraph(
        'Every state-changing API transaction (authentication, activity creation/update/deletion, emission factor update, ML prediction/retraining, recommendation '
        'transition, and CSV batch import) writes an immutable tuple to PostgreSQL <i>AuditLog</i> recording actor identity, action identifier, affected entity name, '
        'serial details, and UTC timestamp. Simultaneously, <i>reportController.js</i> compiles statutory Scope totals directly inside PostgreSQL before rendering:',
        st['body']
    ))
    story.append(Paragraph(
        'E<sub>total</sub> = \u03a3<sub>s\u2208{1,2,3}</sub> \u03a3<sub>k\u2208Scope(s)</sub> ( Q<sub>k</sub> \u00d7 EF<sub>k</sub> \u00d7 M<sub>CO2e,k</sub> ) ,     '
        'S<sub>s</sub>(%) = ( E<sub>s</sub> / E<sub>total</sub> ) \u00d7 100',
        st['eq']
    ))
    story.append(Paragraph(
        'Both <i>PDFKit</i> (streaming binary <i>application/pdf</i> tables grouped by division and GHG Scope with embedded Mode A standardization notices) and '
        '<i>ExcelJS</i> (constructing three formatted worksheets covering executive summaries, Mode B activity ledgers, and factor lineage metadata) execute '
        'deterministically from the same transactional Prisma query snapshot, eliminating discrepancy between tabular spreadsheets and signed PDF submissions. '
        'Furthermore, scenario sensitivity analysis in <i>PredictionInsights.jsx</i> evaluates relative footprint reduction using linear difference shifts '
        '\u0394<i>y</i><sub>pred</sub> = <i>y</i><sub>pred,scen</sub> \u2212 <i>y</i><sub>pred,base</sub> = <b>w</b><super>T</super>(\u0394<b>z</b>), giving plant officers an exact, closed-form '
        'quantification of load shedding or renewable substitution impacts prior to committing test-stand schedules.',
        st['body']
    ))
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 6: EXPERIMENTAL RESULTS AND EVALUATION (Body Pages 18–23)
    # =========================================================================
    story.append(Marker('chapters', 'ch6'))
    story.append(Paragraph('CHAPTER 6: EXPERIMENTAL RESULTS AND EVALUATION', st['chapter']))

    story.append(Paragraph('6.1 Experimental Runtime &amp; Multi-Decade Baseline Trends', st['h2']))
    story.append(Paragraph(
        'All benchmarks, live API integration tests, and production frontend compilations were executed directly against the running three-tier stack: '
        'Vite 5.4.21 React client on port 3000, Express 4.21 API on port 5000 connected to PostgreSQL via Prisma ORM 5.22, and the FastAPI Uvicorn ML engine '
        'on port 8000 running inside the workspace virtual environment (<i>.venv</i>). Table 6.1 summarizes multi-year baseline statistics queried across representative '
        'years of the 2024\u20132051 CSV cohort, confirming stationary annual mean intensity (~22.60\u201323.35 kg CO2) across leap-year and partial terminal windows.',
        st['body']
    ))

    t61a_rows = [
        ['2024 (Initial Baseline Year)', '366', '22.602 kg CO2', '8,272.3 kg CO2', '50.01 kg CO2'],
        ['2028 (Near-Term Horizon)', '366', '23.033 kg CO2', '8,429.9 kg CO2', '51.28 kg CO2'],
        ['2032 / 2036 (Mid-Term Window)', '366 / 366', '22.877 / 23.351 kg', '8,372.9 / 8,546.6 kg', '49.06 / 47.91 kg'],
        ['2040 / 2044 (Long-Term Horizon)', '366 / 366', '23.188 / 22.685 kg', '8,486.7 / 8,302.6 kg', '51.50 / 50.37 kg'],
        ['2048 / 2051* (Terminal Window)', '366 / 138*', '22.713 / 22.840 kg', '8,313.1 / 3,152.0 kg', '47.64 / 45.54 kg'],
    ]
    add_styled_table(story, st,
                     'Table 6.1: Observed Longitudinal Baseline Carbon Statistics Across Representative Years (Preprocessed CSV, *2051 ends May 18)',
                     ['Calendar Horizon', 'Records (n)', 'Annual Mean', 'Annual Total CO2', 'Observed Peak'],
                     t61a_rows, [138, 65, 92, 108, 84], 'tbl61')

    story.append(Paragraph('6.2 Multi-Model Machine Learning Regression Benchmark', st['h2']))
    story.append(Paragraph(
        'Table 6.2 and Fig. 10 report comparative regression performance extracted verbatim from <i>ml-service/models/models_metadata.json</i> across 8,000 training '
        'and 2,000 test observations. <b>Linear Regression</b> achieves top performance on both validation methodologies\u2014Random Test R<super>2</super> = <b>0.8534</b>, '
        'MAE = <b>2.9609 kg CO2</b>, MSE = <b>14.1765</b>, RMSE = <b>3.7652 kg CO2</b>, and Chronological R<super>2</super> = <b>0.8451</b> (Chrono RMSE = <b>3.8156 kg</b>)\u2014'
        'and is automatically serialized as <i>active_model.joblib</i>.',
        st['body']
    ))

    t62a_rows = []
    for m in meta['models']:
        name = m['modelName'] + (' (Active)' if m.get('isActive') else '')
        t62a_rows.append([
            name, m['algorithm'],
            f"{m['r2Score']:.4f}", f"{m['mae']:.4f}", f"{m['mse']:.4f}",
            f"{m['rmse']:.4f}", f"{m['chronoR2Score']:.4f}", f"{m['chronoRmse']:.4f}"
        ])
    add_styled_table(story, st,
                     'Table 6.2: Empirical ML Regression Performance on Random (80/20) and Chronological Splits (n_train=8000, n_test=2000)',
                     ['Model Name', 'Scikit-Learn Class', 'Test R\u00b2', 'MAE (kg)', 'MSE', 'RMSE (kg)', 'Chrono R\u00b2', 'Chrono RMSE'],
                     t62a_rows, [88, 118, 45, 45, 46, 48, 47, 50], 'tbl62')

    add_figure(story, st, 'fig9_ml_benchmark.png',
               'Fig. 10: Side-by-side comparison of random/chronological R\u00b2 scores (Panel A) and MAE/RMSE errors (Panel B) across four models.',
               'fig9', w_inch=6.25, h_inch=2.50)

    story.append(Paragraph('6.3 Parity, Residual Diagnostics &amp; Fitted OLS Parameters', st['h2']))
    story.append(Paragraph(
        'Evaluating <i>active_model.joblib</i> across all 2,000 random test records (Fig. 11) yields tightly symmetric errors centered at zero residual mean without '
        'heteroscedastic fanning. Table 6.3 documents the exact fitted OLS intercept (\u03b2<sub>0</sub> = 22.9549 kg CO2), dominant feature slopes (+6.8606 kg CO2 per '
        'unit energy Z-score and +5.7757 kg CO2 per transport distance Z-score), and empirical absolute test error quantiles (median error = 2.399 kg CO2; 90th percentile = 6.491 kg).',
        st['body']
    ))

    add_figure(story, st, 'fig10_residuals.png',
               'Fig. 11: Observed vs. predicted parity plot (Panel A) and residual error histogram (Panel B) for active Linear Regression (n = 2,000 test samples).',
               'fig10', w_inch=6.25, h_inch=2.45)

    t63a_rows = [
        ['Intercept (\u03b20) & Top Slopes', 'Intercept: 22.9549 kg CO2', 'Energy: +6.8606 kg/\u03c3', 'Transport: +5.7757 kg/\u03c3'],
        ['Secondary Slopes (Signed)', 'Waste: -0.0803 | Fuel: -0.0484', 'Renew %: +0.0448 | Car: +0.0489', 'Walk: +0.0318 | Resid: +0.0165'],
        ['Test Absolute Error Quantiles', 'P25: 1.094 kg | P50: 2.399 kg', 'P75: 4.282 kg | P90: 6.491 kg', 'P95: 7.531 kg | P99: 9.384 kg'],
    ]
    add_styled_table(story, st,
                     'Table 6.3: Active OLS Parameter Estimates and Test-Split Absolute Error Quantiles (n = 2,000)',
                     ['Diagnostic Category', 'Primary Metric / Value', 'Secondary Metric / Value', 'Tail / Auxiliary Metric'],
                     t63a_rows, [130, 122, 120, 115], 'tbl63')

    story.append(Paragraph('6.4 Comparative Feature Attribution Across ML Paradigms', st['h2']))
    story.append(Paragraph(
        'Table 6.4 and Fig. 12 verify cross-model feature agreement: <b>Energy_Usage_kWh</b> (53.02%\u201357.72%) and <b>Transportation_Distance_km</b> (37.68%\u201344.64%) '
        'jointly supply over 91% of predictive attribution across every algorithm, whereas auxiliary behavioral and weather dimensions remain below 1.4%.',
        st['body']
    ))

    top_feats = [
        ('Energy_Usage_kWh', 'Energy Usage (Z)'),
        ('Transportation_Distance_km', 'Transport Distance (Z)'),
        ('Waste_Generated_kg', 'Waste Generated (Z)'),
        ('Fuel_Usage_Liters', 'Fuel Usage (Z)'),
        ('Renewable_Energy_Usage_percent', 'Renewable Share (Z)'),
        ('Smart_Appliance_Usage_hours', 'Smart Appliance (Z)'),
    ]
    t64a_rows = []
    for fkey, flbl in top_feats:
        vals = [f"{m['featureImportances'].get(fkey, 0.0)*100:.2f}%" for m in meta['models']]
        t64a_rows.append([flbl] + vals)
    add_styled_table(story, st,
                     'Table 6.4: Top-6 Relative Feature Attribution Weights Across All Four Evaluated ML Architectures',
                     ['Standardized Predictor', 'Linear Regression', 'Decision Tree', 'Random Forest', 'Gradient Boosting'],
                     t64a_rows, [145, 85, 85, 85, 87], 'tbl64')

    add_figure(story, st, 'fig11_feature_importance.png',
               'Fig. 12: Comparative standardized feature importance percentages across Linear Regression, Decision Tree, Random Forest, and Gradient Boosting.',
               'fig11', w_inch=6.25, h_inch=2.45)

    story.append(Paragraph('6.5 Production Compilation, CSV Ingestion &amp; 40-Check Deployment Audit', st['h2']))
    story.append(Paragraph(
        'Production build verification via <i>vite build</i> compiled <b>1,671 frontend modules</b> cleanly in <b>3.48 s</b> (`dist/index.html` 1.12 kB, CSS 31.89 kB, '
        'JS bundle 598.51 kB). Live end-to-end execution of <i>comprehensiveDeploymentAudit.js</i> recorded <b>35 PASS</b> and <b>5 FAIL</b> across 40 checks '
        '(Table 6.5). Every failing assertion traced strictly to hardcoded baseline comparisons expecting 10,000 rows, because prior validated CSV batch uploads '
        'legitimately persisted 200 synthetic rows into PostgreSQL (total <b>10,200 rows</b>, cumulative CO2 = 234,031 kg).',
        st['body']
    ))

    t65a_rows = [
        ['1. Infrastructure & Services (:3000, :5000, :8000)', '3', '3 PASS / 0 FAIL', 'Frontend HTTP 200; Backend ONLINE; ML healthy'],
        ['2. Database Integrity & Dataset Specs', '4', '2 PASS / 2 FAIL*', '*10,200 rows vs hardcoded 10,000 check after synthetic test imports'],
        ['3. Auth, bcryptjs, JWT & RBAC (ADMIN/OFFICER/ANALYST)', '4', '4 PASS / 0 FAIL', 'All 3 roles authenticated; Analyst blocked (403) on /api/users'],
        ['4. Dashboard Aggregations & Dynamic Filters', '7', '5 PASS / 2 FAIL*', '*Totals reflect 10,200 rows (234,031 kg CO2) vs 10,000 baseline assert'],
        ['5. Dataset Explorer, Dictionary & Sorting', '3', '2 PASS / 1 FAIL*', '*Pagination count increased due to +200 synthetic test rows'],
        ['6. Analytics (13x13 Matrix, Scatter, Clean Quartiles)', '4', '4 PASS / 0 FAIL', 'Top driver verified r = 0.71; quartiles Q1\u2013Q4 computed'],
        ['7. Mode B Activities & Factor Recalculation', '4', '4 PASS / 0 FAIL', 'Create (4100 kg CO2), Update (4920 kg), and Delete verified'],
        ['8. ML Inference & Prediction History Persistence', '3', '3 PASS / 0 FAIL', 'Active Linear Regression inferred 25.244 kg CO2; DB logged'],
        ['9\u201311. Recommendations, Statutory Exports & Audit Logs', '8', '8 PASS / 0 FAIL', 'PDFKit (5,373 B), ExcelJS (321,703 B), CSV, 21 audit logs'],
    ]
    add_styled_table(story, st,
                     'Table 6.5: Live Execution Summary of 40-Assertion Deployment Audit (comprehensiveDeploymentAudit.js)',
                     ['Verification Domain', 'Checks', 'Observed Outcome', 'Verified Diagnostic Notes'],
                     t65a_rows, [148, 38, 86, 215], 'tbl65')

    story.append(Paragraph('6.6 Statutory Export Audits &amp; Scenario Sensitivity Verification', st['h2']))
    story.append(Paragraph(
        'Both statutory report exporters passed binary validation: PDFKit streamed a valid <b>5,373-byte PDF</b> (`%PDF` header) incorporating Mode B activity tables '
        'and standardization disclosures, while ExcelJS produced a valid <b>321,703-byte `.xlsx` workbook</b> containing three formatted worksheets backed by the '
        '10 seeded emission factors summarized in Table 6.6. Table 6.7 illustrates live FastAPI inference behavior across operational test scenarios.',
        st['body']
    ))

    t66a_rows = [
        ['Grid Electricity (CEA India v19)', 'ENERGY', '0.820 kg CO2 / kWh', 'Central Electricity Authority v19 (CO2e x1.00)'],
        ['Diesel (HSD) / Petrol (Gasoline)', 'FUEL', '2.680 / 2.310 kg / L', 'IPCC 2019 Refinement Tier 1 (CO2e x1.01)'],
        ['Compressed Natural Gas (CNG)', 'FUEL', '2.750 kg CO2 / kg', 'MoPNG India / IPCC Stoichiometric (x1.02)'],
        ['Passenger Car / EV / Heavy Truck', 'TRANSPORTATION', '0.171 / 0.053 / 0.297', 'BEE India, CEA Grid EV, GHG Protocol Freight'],
        ['Municipal Solid Waste / Potable Water', 'WASTE / WATER', '0.580 kg/kg / 0.350 kg/kL', 'IPCC FOD Model / CPHEEO & BEE India'],
        ['Liquid Nitrogen (Cryogenic Auxiliary)', 'MATERIAL', '0.450 kg CO2 / kg', 'Industrial Gas Association LCA (ASU Power)'],
    ]
    add_styled_table(story, st,
                     'Table 6.6: Verified Seeded Emission Factors Supporting Mode B Calculations and Statutory Exports',
                     ['Fuel / Activity Standard', 'Category', 'Verified Factor', 'Authoritative Source'],
                     t66a_rows, [145, 78, 95, 169], 'tbl66')

    t67a_rows = [
        ['Nominal Zero-Mean Baseline (All Z = 0.0)', 'Energy = 0.0, Transport = 0.0, Fuel = 0.0', '22.955 kg CO2', 'Matches dataset mean (22.956 kg)'],
        ['Peak Propulsion Test Load (+1.5\u03c3 / +1.0\u03c3)', 'Energy = +1.5, Transport = +1.0, Fuel = +1.0', '38.973 kg CO2', '+69.8% above zero-mean baseline'],
        ['Green Mitigation Dispatch (-1.2\u03c3 / +1.5\u03c3 Clean)', 'Energy = -1.2, Transport = -0.8, Renew = +1.5', '10.169 kg CO2', '-55.7% footprint reduction vs. baseline'],
    ]
    add_styled_table(story, st,
                     'Table 6.7: Operational Sensitivity Scenarios Evaluated via Active Linear Regression Model',
                     ['Operational Scenario Profile', 'Standardized Input Overrides', 'Predicted CO2', 'Relative Operational Shift'],
                     t67a_rows, [145, 145, 78, 119], 'tbl67')

    story.append(Paragraph('6.7 Production Compilation &amp; Live PostgreSQL State Verification', st['h2']))
    story.append(Paragraph(
        'Table 6.8 consolidates verified build artifacts from Vite 5.4.21 alongside live row counts queried directly from the operational PostgreSQL database '
        'and FastAPI service endpoint following synthetic CSV ingestion and operational seeding.',
        st['body']
    ))

    t68a_rows = [
        ['Vite Production Build (npm run build)', '1,671 modules transformed in 3.48 s', 'JS: 598.51 kB | CSS: 31.89 kB | HTML: 1.12 kB'],
        ['PostgreSQL dataset_records Table', '10,200 total rows (10,000 + 200 test CSV)', '16 ImportLog batches logged (0 failed rows)'],
        ['PostgreSQL Operational & Factor Ledgers', '7 ActivityRecords | 10 EmissionFactors', '5 seeded Departments | 4 Recommendations'],
        ['Security & Prediction Audit Tables', '3 RBAC Users | 7 PredictionHistory entries', '21 audited mutation events in AuditLog'],
        ['FastAPI /health & Express /api/health', 'Port 8000 healthy | Port 5000 ONLINE', 'Best ML Model: Linear Regression (12 features)'],
    ]
    add_styled_table(story, st,
                     'Table 6.8: Observed Production Bundle Output and Live Three-Tier State Snapshot',
                     ['Subsystem / Table Verified', 'Observed Cardinality / Metric', 'Verified Artifact / Audit Context'],
                     t68a_rows, [145, 155, 187], 'tbl68')

    story.append(Paragraph('6.8 Synthetic Schema Ingestion &amp; Mitigation Recommendation Verification', st['h2']))
    story.append(Paragraph(
        'To verify end-to-end schema enforcement under realistic user uploads beyond initial seeding, synthetic validation set '
        '<i>Carbon_Footprint_Synthetic_Test_Dataset_100.csv</i> (100 validated records matching all 14 Mode A headers) was submitted through '
        '<i>POST /api/dataset/import</i> alongside multipart upload boundaries in <i>DataImport.jsx</i>. Client-side PapaParse header previewing confirmed '
        'schema alignment prior to server streaming, and PostgreSQL persisted all 100/100 rows cleanly with zero coercion failures across repeated test batches '
        '(raising <i>dataset_records</i> from 10,000 to 10,200 across 16 audited <i>ImportLog</i> runs). Concurrently, malformed non-matching schemas triggered HTTP 400 '
        'rejection without mutating persisted rows.',
        st['body']
    ))
    t69_rows = [
        ['Synthetic Batch CSV Import (100 rows)', 'POST /api/dataset/import -> HTTP 200', '100/100 records committed; ImportLog status COMPLETED'],
        ['Schema Rejection Guardrail (Negative Test)', 'Missing Date / Target -> HTTP 400', 'Upload aborted before transaction; zero corrupt rows'],
        ['Mitigation Recommendations Workflow', '4 active recommendations persisted', 'Priority triage & status transitions logged in AuditLog'],
        ['Statutory Report Preview & Fallback Download', 'PDFKit & ExcelJS Blob + token query', 'Tested with header Bearer auth & query string fallback'],
    ]
    add_styled_table(story, st,
                     'Table 6.9: Verified Schema Ingestion, Negative Guardrail, and Governance Audit Results',
                     ['Operational Workflow Tested', 'Verified API / DB Contract', 'Observed Verification Outcome'],
                     t69_rows, [160, 145, 182], 'tbl69')

    story.append(Paragraph('6.9 Mode B Ledger Recalculation &amp; RBAC Security Verification', st['h2']))
    story.append(Paragraph(
        'Runtime CRUD tests in <i>comprehensiveDeploymentAudit.js</i> directly verified Mode B relational integrity and cryptographic role isolation. Creating a '
        'test substation electricity entry of 5,000 kWh linked to CEA India v19 (0.82 kg CO2/kWh) automatically persisted <i>calculatedCo2 = 4,100.0 kg CO2</i>; '
        'subsequently issuing a <i>PUT /api/activities/:id</i> mutation revising quantity to 6,000 kWh deterministically updated the stored result to '
        '<i>4,920.0 kg CO2</i> before clean <i>DELETE</i> teardown verified ledger rollback.',
        st['body']
    ))
    story.append(Paragraph(
        'Across authorization probes, authenticating with seeded <i>ANALYST</i> and <i>OFFICER</i> JWT credentials cleanly granted read analytics while returning '
        'strict HTTP <b>403 Forbidden</b> responses on restricted endpoints (<i>GET /api/users</i> and mutating admin routes), proving server-side '
        '<i>requireRole(...)</i> enforcement independent of client-side navigation visibility. Together, these verified behaviors demonstrate full readiness across '
        'security, transactional accounting, machine learning inference, and compliance reporting.',
        st['body']
    ))

    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 7: DISCUSSION (Body Pages 24–25)
    # =========================================================================
    story.append(Marker('chapters', 'ch7'))
    story.append(Paragraph('CHAPTER 7: DISCUSSION', st['chapter']))

    story.append(Paragraph('7.1 Why Linear Regression Outperformed Non-Linear Ensembles', st['h2']))
    story.append(Paragraph(
        'An instructive empirical outcome of Chapter 6 is that Ordinary Least Squares <b>Linear Regression</b> (Test R<super>2</super> = 0.8534, '
        'RMSE = 3.7652 kg CO2) outperformed all three non-linear decision-tree architectures\u2014Gradient Boosting (R<super>2</super> = 0.8474), Random Forest '
        '(R<super>2</super> = 0.8428), and Decision Tree (R<super>2</super> = 0.8243)\u2014on both random and chronological validation splits. Examining Chapter 3\'s '
        'correlation matrix clarifies this behavior: physical target carbon emissions respond almost linearly and additively to standardized energy demand '
        '(r = +0.7048) and transportation distance (r = +0.5897), while the remaining ~15% variance behaves as stationary random noise.',
        st['body']
    ))
    story.append(Paragraph(
        'In additive linear regimes, orthogonal axis-aligned cuts within decision trees and boosted ensembles approximate smooth diagonal hyperplanes using '
        'staircase step functions, introducing quantization variance at leaf boundaries without discovering genuine non-linear interactions. Retaining automatic '
        'best-model promotion inside <i>train_models.py</i> provides the best of both worlds: parsimonious linear inference today while allowing Gradient Boosting or '
        'Random Forest to overtake <i>active_model.joblib</i> automatically whenever future site telemetry introduces threshold regimes. Additionally, notice that '
        'chrono-holdout R<super>2</super> drops by less than 0.0083 across Linear Regression (0.8534 to 0.8451), confirming high temporal stationarity and absence '
        'of structural overfitting.',
        st['body']
    ))

    story.append(Paragraph('7.2 Practical Value of Dual-Mode Segregation &amp; Operational Clarity', st['h2']))
    story.append(Paragraph(
        'Structurally isolating <i>dataset_records</i> (Mode A) from <i>activity_records</i> (Mode B) proved decisive during batch CSV ingestion testing. When synthetic '
        '100-row batches were uploaded via <i>DataImport.jsx</i>, PostgreSQL safely scaled Mode A storage from 10,000 to 10,200 rows under audited <i>ImportLog</i> '
        'records without perturbing a single Mode B physical calculation, CEA v19 emission factor, or officer activity audit trail. Likewise, displaying raw Pearson '
        'correlations alongside renewable quartile groupings (Table 3.2) prevented misinterpretation of zero-correlation synthetic quartiles (22.83\u201323.08 kg CO2). '
        'Separating operational activities by GHG Protocol Scope (Scope 1/2/3) ensures engineering divisions (PTF, CEP, EMD, FIU, SQA) receive transparent division-level '
        'accountability.',
        st['body']
    ))

    story.append(Paragraph('7.3 Service Resilience, Graceful Fallback &amp; Security Trade-Offs', st['h2']))
    story.append(Paragraph(
        'Inspection of <i>predictionController.js</i> and <i>ml-service/app.py</i> demonstrates thoughtful resilience: if the FastAPI ML container on port 8000 is '
        'temporarily unreachable, <i>GET /api/predictions/models</i> gracefully falls back to PostgreSQL <i>ModelMetadata</i> records so the dashboard continues '
        'rendering comparative metrics rather than crashing. Similarly, FastAPI initializes models lazily or via async <i>lifespan</i> handlers without blocking startup.',
        st['body']
    ))
    story.append(Paragraph(
        'Security-wise, salted 10-round <i>bcryptjs</i> password verification, HS256 JWT tokens, and Prisma parameterized queries protect user accounts and prevent '
        'SQL injection. Supporting optional <i>?token=</i> query strings on statutory report endpoints enables seamless browser PDF/Excel fallback triggers in '
        '<i>Reports.jsx</i> alongside Authorization-header Blob fetches; in public cloud deployments behind HTTPS, restricting downloads strictly to short-lived '
        'one-time tokens eliminates proxy URL log exposure.',
        st['body']
    ))

    story.append(Paragraph('7.4 Containerized Deployment Architecture (Docker Compose &amp; Nginx)', st['h2']))
    story.append(Paragraph(
        'Beyond local development execution, <i>docker-compose.yml</i> and <i>frontend/nginx.conf</i> define a reproducible four-container production topology: '
        '(1) <b>iprc_postgres</b> (<i>postgres:15-alpine</i>) exposing port 5432 with persistent named volume <i>pgdata</i> and five-second <i>pg_isready</i> health '
        'probes; (2) <b>iprc_ml_service</b> (port 8000) monitored via HTTP <i>/health</i> checks every ten seconds; (3) <b>iprc_backend</b> (port 5000) waiting on '
        'healthy database and ML dependencies before executing idempotent startup initialization (<i>npx prisma db push</i>, <i>seed.js</i>, <i>importDataset.js</i>, '
        'and <i>seedOperationalActivities.js</i>); and (4) <b>iprc_frontend</b> serving static assets via Nginx on mapped host port 3000.',
        st['body']
    ))
    story.append(Paragraph(
        'Inside <i>frontend/nginx.conf</i>, production delivery enables gzip compression for bundles exceeding 10,240 bytes, enforces six-month immutable caching '
        '(<i>max-age=15552000</i>) across hashed Vite JavaScript and CSS chunks, serves HTML5 BrowserRouter routes cleanly via <i>try_files $uri $uri/ /index.html</i>, '
        'and reverse-proxies unified <i>/api/</i> traffic internally to <i>http://backend:5000/api/</i>.',
        st['body']
    ))

    story.append(Paragraph('7.5 Identified System Boundaries and Limitations', st['h2']))
    story.append(Paragraph(
        'Four verifiable system boundaries remain documented for future releases: (1) <b>Pre-Standardized Upload Schema:</b> Mode A CSV import expects files conforming '
        'to the 14-column normalized schema rather than applying an online <i>StandardScaler</i> fit to raw physical inputs; (2) <b>CSV-Bound Retraining:</b> '
        '<i>POST /train</i> reloads <i>Preprocessed_Carbon_Footprint_Dataset.csv</i> rather than querying appended PostgreSQL rows dynamically; (3) <b>Test Suite Count '
        'Coupling:</b> <i>comprehensiveDeploymentAudit.js</i> enforces exact 10,000-row equality rather than \u226510,000, flagging imported test batches as assertion failures '
        'despite successful ingestion; and (4) <b>Linear Contribution Approximation:</b> <i>POST /predict</i> computes global importance-weighted proxies rather than exact SHAP.',
        st['body']
    ))
    story.append(PageBreak())

    # =========================================================================
    # CHAPTER 8: CONCLUSION AND FUTURE SCOPE (Body Pages 26–27)
    # =========================================================================
    story.append(Marker('chapters', 'ch8'))
    story.append(Paragraph('CHAPTER 8: CONCLUSION AND FUTURE SCOPE', st['chapter']))

    story.append(Paragraph('8.1 Summary of Verified Project Contributions', st['h2']))
    story.append(Paragraph(
        'This Minor Project successfully engineered, integrated, and empirically validated <b>IPRC CarbonTrack</b> (Research Reference: <b>RES-IPRC-2025-003</b>), '
        'delivering a modular, submission-ready environmental monitoring and machine learning prediction system aligned with NIT Raipur engineering standards:',
        st['body']
    ))
    for c in [
        '<b>Production-Compiled Full-Stack Architecture:</b> Implemented a 15-view React 18.3 / Vite 5.4 / Chart.js SPA (compiling 1,671 modules cleanly in 3.48 s), a 10-route Express 4.21 API, a 13-model PostgreSQL database via Prisma ORM 5.22, and an asynchronous Python FastAPI ML engine.',
        '<b>Dual-Mode GHG Accounting Integrity:</b> Enforced strict separation between Mode A statistical baselines (10,000 historical/projected observations spanning 2024\u20132051 with zero missing/duplicate cells, expanded to 10,200 rows during verified batch import testing) and Mode B physical activity tracking calibrated against 10 verified emission factors from CEA India v19, IPCC 2019, BEE, CPHEEO, and IGA LCA.',
        '<b>Reproducible Leakage-Free ML Benchmarking:</b> Evaluated Linear Regression, Decision Tree, Random Forest, and Gradient Boosting across random and chronological 80/20 partitions, confirming Ordinary Least Squares Linear Regression as the optimal production estimator (Test R<super>2</super> = 0.8534, MAE = 2.9609 kg CO2, RMSE = 3.7652 kg CO2, Chrono R<super>2</super> = 0.8451) driven by energy demand (r = +0.705) and transport distance (r = +0.590).',
        '<b>Governance, Security &amp; Statutory Reporting:</b> Verified bcryptjs/JWT RBAC segregation across ADMIN, OFFICER, and ANALYST accounts (403 enforcement verified on /api/users), immutable AuditLog persistence, and valid PDFKit (5,373 B) and 3-sheet ExcelJS (321,703 B) exports.'
    ]:
        story.append(Paragraph('\u2022 ' + c, st['bullet']))

    story.append(Paragraph('8.2 Deliverables Traceability Matrix &amp; Future Engineering Roadmap', st['h2']))
    story.append(Paragraph(
        'Table 8.1 maps each stated objective from Chapter 1 directly to its verified source artifacts and observed metrics, while Table 8.2 outlines five phased '
        'extensions designed to evolve IPRC CarbonTrack toward an autonomous multi-facility telemetry platform.',
        st['body']
    ))

    t81a_rows = [
        ['Obj. 1: Three-Tier Platform', 'App.jsx, index.js, app.py, schema.prisma', '15 React views (1,671 Vite modules), 10 API routes, 13 DB models'],
        ['Obj. 2: Zero-Leakage ML', 'train_models.py, models_metadata.json', '4 models benchmarked; Linear Regression active (R\u00b2 = 0.8534)'],
        ['Obj. 3: Mode B Factor Engine', 'activityController.js, seed.js', '10 verified CEA v19 / IPCC / BEE / CPHEEO factors; CRUD auto-calc'],
        ['Obj. 4: Batch CSV Ingestion', 'DataImport.jsx, datasetController.js', '100/100 test CSV rows HTTP 200 OK; 10,200 live rows; 0 failures'],
        ['Obj. 5: RBAC & Exports', 'auth.js, reportController.js', '3 roles, 403 RBAC enforced, PDFKit (5,373 B) & ExcelJS (321,703 B)'],
    ]
    add_styled_table(story, st,
                     'Table 8.1: Objective-to-Implementation & Empirical Verification Traceability Matrix',
                     ['Project Objective', 'Primary Code Artifacts', 'Verified Implementation Evidence'],
                     t81a_rows, [112, 152, 223], 'tbl81')

    t82_rows = [
        ['Phase 1: Dynamic Pipeline Sync', 'FastAPI + Prisma Integration', 'Retrain models directly on cumulative PostgreSQL dataset_records with persisted StandardScaler'],
        ['Phase 2: IoT Telemetry Ingestion', 'MQTT / OPC-UA Connectors', 'Automate substation kWh, DG fuel flow, and cryogenic LN2 sensor feeds into Mode B ActivityRecord'],
        ['Phase 3: Exact Explainable AI', 'TreeSHAP & LinearSHAP', 'Compute instance-level marginal SHAP attributions per inference request inside POST /predict'],
        ['Phase 4: Scope 3 & TimescaleDB', 'Database Partitioning', 'Enable TimescaleDB chronological hypertables and external supplier portals for Scope 3 procurement'],
        ['Phase 5: CI/CD Test Hardening', 'Ephemeral Test Harness', 'Run integration & Playwright UI suites against isolated seeded test containers before deployment'],
    ]
    add_styled_table(story, st,
                     'Table 8.2: Phased Engineering Roadmap for Future Evolution of IPRC CarbonTrack',
                     ['Enhancement Phase', 'Target System Layer', 'Concrete Technical Deliverable'],
                     t82_rows, [120, 122, 245], 'tbl82')

    story.append(Paragraph(
        'In conclusion, IPRC CarbonTrack demonstrates that disciplined database modeling, explicit standardization disclosures, rigorous baseline validation, and '
        'open-source web technologies can unite organizational GHG Protocol compliance and real-time predictive analytics into a single cohesive platform.',
        st['body']
    ))
    story.append(PageBreak())

    # =========================================================================
    # REFERENCES (Body Page 28)
    # =========================================================================
    story.append(Marker('chapters', 'refs'))
    story.append(Paragraph('REFERENCES', st['chapter']))
    story.append(Spacer(1, 2))
    refs = [
        '[1] World Resources Institute and World Business Council for Sustainable Development, "The Greenhouse Gas Protocol: A Corporate Accounting and Reporting Standard," Revised Edition, Washington, DC, USA, 2004.',
        '[2] International Organization for Standardization, "ISO 14064-1:2018 \u2014 Greenhouse gases \u2014 Part 1: Specification with guidance at the organization level for quantification and reporting of greenhouse gas emissions and removals," Geneva, Switzerland, 2018.',
        '[3] Central Electricity Authority (CEA), Ministry of Power, Government of India, "CO2 Baseline Database for the Indian Power Sector (User Guide & Baseline Dataset Version 19.0)," New Delhi, India, 2023.',
        '[4] Intergovernmental Panel on Climate Change (IPCC), "2019 Refinement to the 2006 IPCC Guidelines for National Greenhouse Gas Inventories," Calvo Buendia, E. et al. (Eds.), IPCC, Switzerland, 2019.',
        '[5] Bureau of Energy Efficiency (BEE), Ministry of Power, Government of India, "Energy Conservation & Emission Benchmarking Guidelines for Transport and Commercial Buildings," New Delhi, India, 2023.',
        '[6] T. Hastie, R. Tibshirani, and J. Friedman, "The Elements of Statistical Learning: Data Mining, Inference, and Prediction," 2nd ed., Springer Series in Statistics, New York, NY, USA, 2009.',
        '[7] L. Breiman, "Random Forests," Machine Learning, vol. 45, no. 1, pp. 5\u201332, Oct. 2001.',
        '[8] J. H. Friedman, "Greedy function approximation: A gradient boosting machine," Annals of Statistics, vol. 29, no. 5, pp. 1189\u20131232, Oct. 2001.',
        '[9] Z. Wang and R. S. Srinivasan, "A review of artificial intelligence based building energy use prediction: Contrasting the capabilities of single and ensemble prediction models," Renewable and Sustainable Energy Reviews, vol. 75, pp. 796\u2013808, Aug. 2017.',
        '[10] K. Amasyali and N. M. El-Gohary, "A review of data-driven building energy consumption prediction studies," Renewable and Sustainable Energy Reviews, vol. 81, pp. 1192\u20131205, Jan. 2018.',
        '[11] S. Kaufman, S. Rosset, C. Perlich, and O. Stitelman, "Leakage in data mining: Formulation, detection, and avoidance," ACM Transactions on Knowledge Discovery from Data (TKDD), vol. 6, no. 4, pp. 1\u201321, Dec. 2012.',
        '[12] F. Pedregosa et al., "Scikit-learn: Machine Learning in Python," Journal of Machine Learning Research, vol. 12, pp. 2825\u20132830, Nov. 2011.',
        '[13] S. Ramirez, "FastAPI: High-performance modern web framework for building APIs with Python 3.8+," ASGI Open-Source Specification, 2024.',
        '[14] Meta Platforms, Inc., "React 18 User Interface Library," and Evan You, "Vite Next-Generation Frontend Build Tooling," 2024.',
        '[15] OpenJS Foundation, "Express 4.x Web Framework for Node.js," and Prisma Data, Inc., "Prisma ORM Schema & Client Reference," 2024.',
        '[16] M. Jones, J. Bradley, and N. Sakimura, "JSON Web Token (JWT)," Internet Engineering Task Force (IETF), RFC 7519, May 2015.',
        '[17] PostgreSQL Global Development Group, "PostgreSQL Relational Database Management System Documentation," 2024.',
        '[18] Central Public Health and Environmental Engineering Organisation (CPHEEO), Ministry of Housing and Urban Affairs, India, "Manual on Water Supply and Treatment," New Delhi, India.',
    ]
    for r in refs:
        story.append(Paragraph(r, st['ref']))

    return story

def main():
    with open(META_PATH, 'r') as f:
        meta = json.load(f)
    st = make_styles()

    tracker = {'chapters': {}, 'figures': {}, 'tables': {}}
    tmp_path = PDF_PATH + '.pass1.tmp'
    doc1 = TrackingDocTemplate(tmp_path, tracker, pagesize=A4, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    story1 = build_story(st, meta, tracker)
    doc1.build(story1, canvasmaker=NumberedCanvas)
    if os.path.exists(tmp_path):
        os.remove(tmp_path)

    print('Pass 1 recorded pages:', tracker)

    doc2 = TrackingDocTemplate(PDF_PATH, {'chapters': {}, 'figures': {}, 'tables': {}},
                               pagesize=A4, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54,
                               title='IPRC CarbonTrack - Minor Project End-Semester Report',
                               author='D. V. V. Anjaneya Kumar, Yash Mittal')
    story2 = build_story(st, meta, tracker)
    doc2.build(story2, canvasmaker=NumberedCanvas)
    print('Final PDF written to:', PDF_PATH)

if __name__ == '__main__':
    main()
