import { PDFDocument, PDFName, PDFDict, PDFArray } from 'pdf-lib';
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
  district?: string;
  branchId?: string;
  isMemberOfOtherUnion?: boolean;
}

interface BranchData {
  id: string;
  name: string;
}

/**
 * Format date for PDF display (DDMMYYYY)
 */
function formatDate(dateInput?: any): string {
  if (!dateInput) return '';
  try {
    let date: Date;
    
    // Handle Firestore Timestamp like objects { _seconds: number, ... }
    if (typeof dateInput === 'object' && dateInput._seconds) {
        date = new Date(dateInput._seconds * 1000);
    } 
    // Handle simplified date string "YYYY-MM-DD" or ISO string
    else {
        date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return String(dateInput);
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    // User request: DDMMYYYY without separators (ilk iki hane day, ortası ay, diğer 4lü yıl)
    return `${day}${month}${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Generate user registration form PDF by filling the official template (kayitformu.pdf)
 * Uses fontkit + Roboto font for Turkish character support (ğ, ı, ş, ö, ç, ü)
 * @returns The object URL of the generated PDF
 */
export async function generateUserRegistrationPDF(
  userData: UserData,
  _branch?: BranchData,
  options: { download?: boolean; isReadOnly?: boolean } = { download: true, isReadOnly: true }
): Promise<string> {
  const { download = true, isReadOnly = true } = options;

  try {
    // 1. Fetch template PDF and Turkish-supporting font in parallel
    // Cache-busting: add timestamp to force fresh fetch
    const [templateResponse, fontResponse] = await Promise.all([
      fetch(`/templates/kayitformu.pdf?t=${Date.now()}`),
      fetch('/fonts/Roboto-Regular.ttf'),
    ]);

    const contentType = templateResponse.headers.get('content-type');

    if (!templateResponse.ok) {
      throw new Error(`Template PDF yüklenemedi (HTTP ${templateResponse.status})`);
    }
    // Double check content type to avoid "No PDF header found" error
    if (contentType && !contentType.includes('pdf')) {
        throw new Error('Template PDF dosyası bulunamadı. Sunucu PDF yerine HTML döndürdü (Dosya public/templates klasöründe mi?)');
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
        // Check if field exists before getting it
        const field = form.getFields().find(f => f.getName() === fieldName);
        if (field && value) {
            // Cast to TextField since we know we're mostly dealing with text fields here
            // or just use getTextField safely now that we know it exists
            const textField = form.getTextField(fieldName);
            if (textField) {
                textField.setText(value);
                textField.updateAppearances(turkishFont);
            }
        } else {
             // Silently ignore missing fields to support multiple template versions
             // console.debug(`Field ${fieldName} not found in PDF template`);
        }
      } catch (e) {
        // console.warn(`PDF alan '${fieldName}' doldurulamadı:`, e);
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
    setField('ilkodu', '42'); // İl Kodu
    setField('sendikaadress', 'Cebeci - Ankara');
    setField('kurumname', 'Diyanet');
    setField('gybname', 'Müftülük');
    setField('gybadress', userData.district || '');

    // ── User personal info ──────────────────────────
    setField('ad', userData.firstName || '');
    setField('soyad', userData.lastName || '');
    setField('tckimlikno', userData.tcKimlikNo || '');
    setField('babaadi', userData.fatherName || '');
    setField('anneadi', userData.motherName || '');
    
    // Doğum Tarihi (template alanı: dt)
    if (userData.birthDate) {
        setField('dt', formatDate(userData.birthDate));
    }
    
    // Doğum Yeri (template alanı: dy)
    setField('dy', userData.birthPlace || '');

    // ── Work / position info ────────────────────────
    setField('ilcename', userData.district || '');
    setField('kurumsicil', userData.kurumSicil || '');
    setField('kadrounvan', userData.kadroUnvani || '');

    // Kullanıcı isteği üzerine tarih alanı boş bırakılıyor
    // const today = new Date();
    // setField('day', today.getDate().toString().padStart(2, '0'));
    // setField('month', (today.getMonth() + 1).toString().padStart(2, '0'));
    // setField('year', today.getFullYear().toString().slice(-2));

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

    // 5. Flatten or keep editable based on isReadOnly flag
    if (isReadOnly) {
      // True flatten: remove the AcroForm entirely so no PDF viewer treats fields as fillable.
      // First, update all field appearances so the text is baked into the page content.
      // We do a manual flatten: for each field, keep the appearance stream but remove the widget annotation's /FT.
      flattenForm(pdfDoc);
    }

    // 6. Save and download
    // We already updated appearances for the fields we set, so skip global refresh.
    const pdfBytes = await pdfDoc.save({ updateFieldAppearances: false });
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    if (download) {
      const fileName = `${userData.firstName || 'Kullanici'}_${userData.lastName || 'Bilgileri'}_Kayit_Formu.pdf`
        .replace(/[^a-zA-Z0-9_ığüşöçİĞÜŞÖÇ.]/g, '_');

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // If downloading, we might revoke the object URL shortly after, 
      // but if we return it for preview, we should let the caller handle revocation or let it be.
      // For now, we return the URL so the caller can use it if needed.
    }
    
    return url;
  } catch (error) {
    console.error('PDF oluşturulurken hata:', error);
    throw new Error('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
  }
}

/**
 * Truly flatten a PDF form: removes ALL form interactivity.
 *
 * pdf-lib's form.flatten() only removes fields from AcroForm but leaves
 * Widget annotations on pages (especially problematic ones like signature
 * fields without appearance streams, or orphaned widgets).
 *
 * This function:
 * 1. Removes broken fields (no appearance) from AcroForm so flatten() won't crash
 * 2. Calls form.flatten() to bake field values into page content
 * 3. Removes AcroForm dictionary entirely from the PDF catalog
 * 4. Removes ALL remaining /Widget annotations from every page
 *
 * Result: zero fillable fields in any PDF viewer.
 */
function flattenForm(pdfDoc: PDFDocument): void {
  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    // Step 1: Identify fields that would cause form.flatten() to crash
    // (fields with missing appearance streams, e.g. empty signature widgets)
    const brokenFieldRefs: any[] = [];

    for (const field of fields) {
      try {
        const widgets = field.acroField.getWidgets();
        let hasIssue = false;

        widgets.forEach((w: any) => {
          const ap = w.dict.lookup(PDFName.of('AP'));
          if (!ap) {
            hasIssue = true;
          } else if (ap instanceof PDFDict) {
            if (!ap.has(PDFName.of('N'))) {
              hasIssue = true;
            }
          }
        });

        if (hasIssue) {
          brokenFieldRefs.push(field.ref);
        }
      } catch {
        // If we can't even inspect the field, mark it for removal
        try { brokenFieldRefs.push(field.ref); } catch { /* ignore */ }
      }
    }

    // Step 2: Remove broken fields from AcroForm's Fields array
    if (brokenFieldRefs.length > 0) {
      const rawForm = pdfDoc.catalog.lookup(PDFName.of('AcroForm'));
      if (rawForm instanceof PDFDict) {
        const fieldsArr = rawForm.lookup(PDFName.of('Fields'));
        if (fieldsArr instanceof PDFArray) {
          const preserved: any[] = [];
          for (let i = 0; i < fieldsArr.size(); i++) {
            const ref = fieldsArr.get(i);
            if (!brokenFieldRefs.includes(ref)) {
              preserved.push(ref);
            }
          }
          while (fieldsArr.size() > 0) fieldsArr.remove(0);
          preserved.forEach((ref) => fieldsArr.push(ref));
        }
      }
    }

    // Step 3: Flatten all remaining (valid) fields into static page content
    form.flatten();

    // Step 4: Remove the AcroForm dictionary from catalog
    // This ensures no PDF viewer detects the document as a "form PDF"
    pdfDoc.catalog.delete(PDFName.of('AcroForm'));

    // Step 5: Remove ALL /Widget annotations from every page
    // form.flatten() leaves Widget annotation dictionaries on pages even after
    // removing them from AcroForm. Some viewers (Chrome, Adobe) still render
    // these as interactive fields (especially orphaned widgets like "hizmet kolu").
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const annotsObj = page.node.lookup(PDFName.of('Annots'));
      if (annotsObj instanceof PDFArray) {
        const nonWidgetRefs: any[] = [];
        for (let i = 0; i < annotsObj.size(); i++) {
          const annotRef = annotsObj.get(i);
          const annot = annotsObj.lookup(i);
          if (annot instanceof PDFDict) {
            const subtype = annot.lookup(PDFName.of('Subtype'));
            // Keep non-Widget annotations (Link, Popup, etc.)
            if (subtype && subtype.toString() !== '/Widget') {
              nonWidgetRefs.push(annotRef);
            }
          } else {
            // Keep unknown annotation types
            nonWidgetRefs.push(annotRef);
          }
        }
        // Replace the annotations array with only non-Widget entries
        while (annotsObj.size() > 0) annotsObj.remove(0);
        nonWidgetRefs.forEach((ref) => annotsObj.push(ref));

        // If no annotations remain, remove the Annots key entirely
        if (annotsObj.size() === 0) {
          page.node.delete(PDFName.of('Annots'));
        }
      }
    }
  } catch (e) {
    // Ultimate fallback: just nuke AcroForm + all Widget annotations
    console.error('Form flatten error, using fallback:', e);
    try {
      pdfDoc.catalog.delete(PDFName.of('AcroForm'));
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const annotsObj = page.node.lookup(PDFName.of('Annots'));
        if (annotsObj instanceof PDFArray) {
          const keep: any[] = [];
          for (let i = 0; i < annotsObj.size(); i++) {
            const ref = annotsObj.get(i);
            const annot = annotsObj.lookup(i);
            if (annot instanceof PDFDict) {
              const st = annot.lookup(PDFName.of('Subtype'));
              if (st && st.toString() !== '/Widget') keep.push(ref);
            } else {
              keep.push(ref);
            }
          }
          while (annotsObj.size() > 0) annotsObj.remove(0);
          keep.forEach((r) => annotsObj.push(r));
          if (annotsObj.size() === 0) page.node.delete(PDFName.of('Annots'));
        }
      }
    } catch { /* last resort failed */ }
  }
}

/**
 * Fill a single PDF template with user data and return the PDFDocument.
 * Shared logic used by both kayıtformu and istifaformu.
 */
async function fillTemplatePDF(
  templatePath: string,
  userData: UserData,
  _branch?: BranchData,
  options: { isReadOnly?: boolean } = {}
): Promise<PDFDocument> {
  const { isReadOnly = false } = options;
  const isIstifaTemplate = templatePath.includes('istifaformu');

  const [templateResponse, fontResponse] = await Promise.all([
    fetch(`${templatePath}?t=${Date.now()}`),
    fetch('/fonts/Roboto-Regular.ttf'),
  ]);

  if (!templateResponse.ok) {
    throw new Error(`Template PDF yüklenemedi (HTTP ${templateResponse.status})`);
  }
  const contentType = templateResponse.headers.get('content-type');
  if (contentType && !contentType.includes('pdf')) {
    throw new Error('Template PDF dosyası bulunamadı.');
  }
  if (!fontResponse.ok) {
    throw new Error(`Font dosyası yüklenemedi (HTTP ${fontResponse.status})`);
  }

  const [templateBytes, fontBytes] = await Promise.all([
    templateResponse.arrayBuffer(),
    fontResponse.arrayBuffer(),
  ]);

  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const turkishFont = await pdfDoc.embedFont(fontBytes);
  const form = pdfDoc.getForm();

  const setField = (fieldName: string, value: string) => {
    try {
      const field = form.getFields().find(f => f.getName() === fieldName);
      if (field && value) {
        const textField = form.getTextField(fieldName);
        if (textField) {
          textField.setText(value);
          textField.updateAppearances(turkishFont);
        }
      }
    } catch { /* ignore */ }
  };

  const checkBox = (fieldName: string) => {
    try {
      const cb = form.getCheckBox(fieldName);
      if (cb) cb.check();
    } catch { /* ignore */ }
  };

  // ── Default values ──
  // İstifa formu için kullanıcı isteğiyle bu alanlar artık otomatik doldurulmuyor:
  // sendikaadress, kurumname/kurumunadi, gybname, gybadress, ilname, ilkodu
  if (!isIstifaTemplate) {
    setField('ilname', 'Konya');
    setField('ilkodu', '42');
    setField('sendikaadress', 'Cebeci - Ankara');
    setField('kurumname', 'Diyanet');
    setField('kurumunadi', 'Diyanet');
    setField('gybname', 'Müftülük');
    setField('gybadress', userData.district || '');
  }

  // ── User personal info ──
  setField('ad', userData.firstName || '');
  setField('soyad', userData.lastName || '');
  setField('tckimlikno', userData.tcKimlikNo || '');
  setField('babaadi', userData.fatherName || '');
  setField('anneadi', userData.motherName || '');
  if (userData.birthDate) {
    setField('dt', formatDate(userData.birthDate));
  }
  setField('dy', userData.birthPlace || '');

  // ── Work / position info ──
  // İstifa formu için ilçe alanı otomatik doldurulmasın
  if (!isIstifaTemplate) {
    setField('ilcename', userData.district || '');
  }
  setField('kurumsicil', userData.kurumSicil || '');
  setField('kadrounvan', userData.kadroUnvani || '');

  // ── Gender ──
  if (userData.gender === 'male') checkBox('male');
  else if (userData.gender === 'female') checkBox('female');

  // ── Education ──
  if (userData.education === 'ilkogretim') checkBox('ilkogretim');
  else if (userData.education === 'lise') checkBox('lise');
  else if (userData.education === 'yuksekokul') checkBox('yuksekokul');

  if (isReadOnly) {
    flattenForm(pdfDoc);
  }

  return pdfDoc;
}

/**
 * Generate merged PDF: kayıtformu (page 1) + istifaformu (page 2)
 * Both templates are filled with the same user data.
 * Preview mode: editable fields. Download mode: flattened (no fillable fields).
 */
export async function generateMergedRegistrationPDF(
  userData: UserData,
  _branch?: BranchData,
  options: { download?: boolean; isReadOnly?: boolean } = { download: true, isReadOnly: true }
): Promise<string> {
  const { download = true, isReadOnly = true } = options;

  try {
    // Fill both templates in parallel
    const [kayitDoc, istifaDoc] = await Promise.all([
      fillTemplatePDF('/templates/kayitformu.pdf', userData, _branch, { isReadOnly }),
      fillTemplatePDF('/templates/istifaformu.pdf', userData, _branch, { isReadOnly }),
    ]);

    // Create a new merged document
    const mergedDoc = await PDFDocument.create();

    // Copy pages from kayıt formu
    const kayitPages = await mergedDoc.copyPages(kayitDoc, kayitDoc.getPageIndices());
    for (const page of kayitPages) {
      mergedDoc.addPage(page);
    }

    // Copy pages from istifa formu
    const istifaPages = await mergedDoc.copyPages(istifaDoc, istifaDoc.getPageIndices());
    for (const page of istifaPages) {
      mergedDoc.addPage(page);
    }

    const pdfBytes = await mergedDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    if (download) {
      const fileName = `${userData.firstName || 'Kullanici'}_${userData.lastName || 'Bilgileri'}_Kayit_ve_Istifa_Formu.pdf`
        .replace(/[^a-zA-Z0-9_ığüşöçİĞÜŞÖÇ.]/g, '_');

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return url;
  } catch (error) {
    console.error('Birleşik PDF oluşturulurken hata:', error);
    throw new Error('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
  }
}
