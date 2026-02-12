import jsPDF from 'jspdf';
import { EDUCATION_LEVEL_LABELS } from '@shared/constants/education';

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
 * Format date for PDF display
 */
function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  } catch {
    return dateString;
  }
}

/**
 * Get gender label in Turkish
 */
function getGenderLabel(gender?: 'male' | 'female' | ''): string {
  if (gender === 'male') return 'Erkek';
  if (gender === 'female') return 'Kadın';
  return '-';
}

/**
 * Get education label in Turkish
 */
function getEducationLabel(education?: string): string {
  if (!education) return '-';
  return (EDUCATION_LEVEL_LABELS as Record<string, string>)[education] || education;
}

/**
 * Generate user registration form PDF
 */
export function generateUserRegistrationPDF(
  userData: UserData,
  branch?: BranchData
): void {
  const doc = new jsPDF();
  
  // Page settings
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;
  const lineHeight = 7;
  
  // Helper function to add field
  const addField = (label: string, value: string) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 60, yPos);
    yPos += lineHeight;
  };
  
  // Header
  doc.setFillColor(51, 65, 85); // slate-700
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ÜYELİK KAYIT FORMU', pageWidth / 2, 18, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPos = 45;
  
  // Section 1: Kişisel Bilgiler
  doc.setFillColor(239, 246, 255); // blue-50
  doc.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 10, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('KİŞİSEL BİLGİLER', margin, yPos);
  yPos += 12;
  
  addField('Ad', userData.firstName || '-');
  addField('Soyad', userData.lastName || '-');
  addField('TC Kimlik No', userData.tcKimlikNo || '-');
  addField('Doğum Tarihi', formatDate(userData.birthDate));
  addField('Doğum Yeri', userData.birthPlace || '-');
  addField('Cinsiyet', getGenderLabel(userData.gender));
  addField('Baba Adı', userData.fatherName || '-');
  addField('Anne Adı', userData.motherName || '-');
  
  yPos += 5;
  
  // Section 2: İletişim Bilgileri
  doc.setFillColor(239, 246, 255);
  doc.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 10, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('İLETİŞİM BİLGİLERİ', margin, yPos);
  yPos += 12;
  
  addField('E-posta', userData.email || '-');
  addField('Telefon', userData.phone || '-');
  
  yPos += 5;
  
  // Section 3: Görev Bilgileri
  doc.setFillColor(239, 246, 255);
  doc.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 10, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GÖREV BİLGİLERİ', margin, yPos);
  yPos += 12;
  
  addField('Şube', branch?.name || '-');
  addField('Görev İlçesi', userData.district || '-');
  addField('Kadro Ünvanı', userData.kadroUnvani || '-');
  addField('Kadro Ünvan Kodu', userData.kadroUnvanKodu || '-');
  addField('Kurum Sicil', userData.kurumSicil || '-');
  addField('Öğrenim Durumu', getEducationLabel(userData.education));
  
  yPos += 5;
  
  // Section 4: Diğer Bilgiler
  doc.setFillColor(239, 246, 255);
  doc.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 10, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DİĞER BİLGİLER', margin, yPos);
  yPos += 12;
  
  const unionMembership = userData.isMemberOfOtherUnion === true 
    ? 'Evet' 
    : userData.isMemberOfOtherUnion === false 
    ? 'Hayır' 
    : '-';
  addField('Başka Sendikaya Üyelik', unionMembership);
  
  yPos += 15;
  
  // Signature section
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin;
  }
  
  yPos += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, margin + 60, yPos);
  doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Üye İmzası', margin + 15, yPos);
  doc.text('Şube Yetkilisi İmzası', pageWidth - margin - 45, yPos);
  
  // Footer
  yPos = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  const today = new Date().toLocaleDateString('tr-TR');
  doc.text(`Oluşturulma Tarihi: ${today}`, margin, yPos);
  doc.text(`Sayfa 1/1`, pageWidth - margin - 20, yPos);
  
  // Generate filename
  const fileName = `${userData.firstName || 'Kullanici'}_${userData.lastName || 'Bilgileri'}_Kayit_Formu.pdf`
    .replace(/[^a-zA-Z0-9_ığüşöçİĞÜŞÖÇ]/g, '_');
  
  // Save PDF
  doc.save(fileName);
}
