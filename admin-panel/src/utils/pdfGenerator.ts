import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | '';
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: string;
  kurumSicil?: string;
  kadroUnvani?: string;
  kadroUnvanKodu?: string;
  district?: string;
  branchId?: string;
  isMemberOfOtherUnion?: boolean;
}

interface BranchData {
  id: string;
  name: string;
}

/**
 * Format date for PDF display (DD.MM.YYYY)
 */
function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Generate user registration form PDF by filling the official template (kayitformu.pdf)
 * Uses fontkit + Roboto font for Turkish character support (ğ, ı, ş, ö, ç, ü)
 */
export async function generateUserRegistrationPDF(
  userData: UserData,
  _branch?: BranchData
): Promise<void> {
  try {
    // 1. Fetch template PDF and Turkish-supporting font in parallel
    const [templateResponse, fontResponse] = await Promise.all([
      fetch('/templates/kayitformu.pdf'),
      fetch('/fonts/Roboto-Regular.ttf'),
    ]);

    if (!templateResponse.ok) {
      throw new Error(`Template PDF yüklenemedi (HTTP ${templateResponse.status})`);
    }
    if (!fontResponse.ok) {
      throw new Error(`Font dosyası yüklenemedi (HTTP ${fontResponse.status})`);
    }

    const [templateBytes, fontBytes] = await Promise.all([
      templateResponse.arrayBuffer(),
      fontResponse.arrayBuffer(),
    ]);

    // 2. Load PDF and register fontkit for custom font embedding
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);

    // 3. Embed Roboto font (supports Turkish chars: ğ, ı, ş, ö, ç, ü, İ, Ğ, Ü, Ş, Ö, Ç)
    const turkishFont = await pdfDoc.embedFont(fontBytes);

    const form = pdfDoc.getForm();

    // 4. Helper: set a text field value and update its appearance with Turkish font
    const setField = (fieldName: string, value: string) => {
      try {
        const field = form.getTextField(fieldName);
        if (field && value) {
          field.setText(value);
          field.updateAppearances(turkishFont);
        }
      } catch (e) {
        console.warn(`PDF alan '${fieldName}' doldurulamadı:`, e);
      }
    };

    // Helper: check a checkbox field (for gender & education)
    const checkBox = (fieldName: string) => {
      try {
        const cb = form.getCheckBox(fieldName);
        if (cb) {
          cb.check();
        }
      } catch (e) {
        console.warn(`PDF checkbox '${fieldName}' işaretlenemedi:`, e);
      }
    };

    // ── Default values ──────────────────────────────
    setField('ilname', 'Konya');
    setField('text_12sfgt', '42'); // İl Kodu

    // ── User personal info ──────────────────────────
    setField('ad', userData.firstName || '');
    setField('soyad', userData.lastName || '');
    setField('tc', userData.tcKimlikNo || '');
    setField('babaadi', userData.fatherName || '');
    setField('anneadi', userData.motherName || '');
    setField('dt', formatDate(userData.birthDate));
    setField('dy', userData.birthPlace || '');

    // ── Work / position info ────────────────────────
    setField('ilcename', userData.district || '');
    setField('kurumsicil', userData.kurumSicil || '');
    setField('kadrounvan', userData.kadroUnvani || '');
    setField('unvancode', userData.kadroUnvanKodu || '');

    // ── Today's date (üyelik başvuru tarihi) ────────
    const today = new Date();
    setField('day', today.getDate().toString().padStart(2, '0'));
    setField('month', (today.getMonth() + 1).toString().padStart(2, '0'));
    setField('year', today.getFullYear().toString().slice(-2));

    // ── Gender (checkboxes: male/female) ─────────
    if (userData.gender === 'male') {
      checkBox('male');
    } else if (userData.gender === 'female') {
      checkBox('female');
    }

    // ── Education (checkboxes: ilkogretim/lise/yuksekokul) ───
    if (userData.education === 'ilkogretim') {
      checkBox('ilkogretim');
    } else if (userData.education === 'lise') {
      checkBox('lise');
    } else if (userData.education === 'yuksekokul') {
      checkBox('yuksekokul');
    }

    // 5. Some templates contain widgets without /N appearance (e.g. signature widget),
    // so `form.flatten()` throws `Unexpected N type: undefined`.
    // Instead of flattening, make all fields read-only.
    const fields = form.getFields();
    for (const field of fields) {
      try {
        field.enableReadOnly();
      } catch {
        // ignore fields that don't support read-only
      }
    }

    // 6. Save and download
    // We already updated appearances for the fields we set, so skip global refresh.
    const pdfBytes = await pdfDoc.save({ updateFieldAppearances: false });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const fileName = `${userData.firstName || 'Kullanici'}_${userData.lastName || 'Bilgileri'}_Kayit_Formu.pdf`
      .replace(/[^a-zA-Z0-9_ığüşöçİĞÜŞÖÇ.]/g, '_');

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF oluşturulurken hata:', error);
    throw new Error('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
  }
}
