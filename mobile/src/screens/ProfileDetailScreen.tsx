// Profile Detail Screen – Modern profil görüntüleme & düzenleme
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useSecureScreen } from '../hooks/useSecureScreen';
import { BirthDatePickerModal } from '../components/BirthDatePickerModal';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';
import { KONYA_DISTRICTS } from '../../../shared/constants/districts';
import { EDUCATION_LEVEL_OPTIONS } from '../../../shared/constants/education';
import { CustomInput } from '../components/CustomInput';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');

/* ── Formlar ── */
type BasicForm = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  birthDate: string;
};

type JobForm = {
  district: string;
  kadroUnvani: string;
};

type DetailForm = {
  tcKimlikNo: string;
  fatherName: string;
  motherName: string;
  birthPlace: string;
  education: string;
  kurumSicil: string;
};

/* ── Helpers ── */
const formatBirthDate = (birthDate: any): string => {
  if (!birthDate) return '';
  const raw = birthDate;
  let d: Date | null = null;
  if (raw?.toDate) d = raw.toDate();
  else if (raw?._seconds !== undefined) d = new Date(raw._seconds * 1000);
  else if (raw?.seconds !== undefined) d = new Date(raw.seconds * 1000);
  else if (typeof raw === 'string' && raw.length >= 10)
    d = new Date(raw.includes('T') ? raw : `${raw}T12:00:00.000Z`);
  else if (raw instanceof Date) d = raw;
  if (!d || isNaN(d.getTime())) return '';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

/** DB'den gelen telefon: "+905551234567" / "05551234567" / "5551234567" → "5551234567" */
const normalizePhone = (raw: string): string => {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  return digits.slice(0, 10);
};

/** "5551234567" → "555 123 45 67" */
const formatPhoneDisplay = (raw: string): string => {
  const d = normalizePhone(raw);
  if (!d) return '';
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
};

const displayDate = (iso: string): string | undefined => {
  if (!iso) return undefined;
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

/* ── InfoRow bileşeni ── */
const InfoRow: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  last?: boolean;
}> = ({ icon, label, value, last }) => (
  <View style={[iRow.wrap, last && iRow.wrapLast]}>
    <View style={iRow.iconBox}>
      <Feather name={icon} size={15} color="#6366f1" />
    </View>
    <View style={iRow.body}>
      <Text style={iRow.label}>{label}</Text>
      <Text style={[iRow.value, !value && iRow.valueMuted]} numberOfLines={1}>{value || 'Belirtilmemiş'}</Text>
    </View>
  </View>
);

const iRow = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f1f5f9',
  },
  wrapLast: { borderBottomWidth: 0 },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center',
  },
  body: { flex: 1 },
  label: { fontSize: 11, fontWeight: '500', color: '#94a3b8', letterSpacing: 0.4, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  valueMuted: { color: '#cbd5e1', fontWeight: '400', fontStyle: 'italic' },
});

/* ── SectionCard bileşeni ── */
const SectionCard: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  title: string;
  children: React.ReactNode;
  badge?: string;
}> = ({ icon, title, children, badge }) => (
  <View style={sec.card}>
    <View style={sec.header}>
      <View style={sec.headerLeft}>
        <LinearGradient colors={['#6366f1', '#4f46e5']} style={sec.headerIcon}>
          <Feather name={icon} size={14} color="#fff" />
        </LinearGradient>
        <Text style={sec.headerTitle}>{title}</Text>
      </View>
      {badge && (
        <View style={sec.badge}><Text style={sec.badgeText}>{badge}</Text></View>
      )}
    </View>
    {children}
  </View>
);

const sec = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: '#fff', borderRadius: 20,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12,
    elevation: 3, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f1f5f9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 30, height: 30, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', letterSpacing: 0.1 },
  badge: {
    backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#92400e', letterSpacing: 0.3 },
});

/* ── Picker select touchable ── */
const PickerField: React.FC<{
  label: string;
  icon: keyof typeof Feather.glyphMap;
  value?: string;
  placeholder: string;
  onPress: () => void;
}> = ({ label, icon, value, placeholder, onPress }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={pf.label}>{label}</Text>
    <TouchableOpacity style={pf.row} onPress={onPress} activeOpacity={0.7}>
      <Feather name={icon} size={16} color="#94a3b8" />
      <Text style={[pf.val, !value && pf.ph]} numberOfLines={1}>{value || placeholder}</Text>
      <Feather name="chevron-down" size={16} color="#94a3b8" />
    </TouchableOpacity>
  </View>
);

const pf = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8, marginLeft: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 16, height: 50,
  },
  val: { flex: 1, fontSize: 15, color: '#1e293b', fontWeight: '500' },
  ph: { color: '#94a3b8', fontWeight: '400' },
});

/* ══════════════════════════════════════════════════════════════════════ */
/*                           ANA BİLEŞEN                               */
/* ══════════════════════════════════════════════════════════════════════ */

type Nav = NativeStackNavigationProp<RootStackParamList, 'ProfileDetail'>;

export const ProfileDetailScreen: React.FC<{ navigation: Nav }> = ({ navigation }) => {
  useSecureScreen();
  const { user, refreshUser, isActive } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [genderVisible, setGenderVisible] = useState(false);
  const [districtVisible, setDistrictVisible] = useState(false);
  const [educationVisible, setEducationVisible] = useState(false);

  // Forms
  const [basicForm, setBasicForm] = useState<BasicForm>({ firstName: '', lastName: '', phone: '', gender: '', birthDate: '' });
  const [originalBasic, setOriginalBasic] = useState<BasicForm | null>(null);
  const [jobForm, setJobForm] = useState<JobForm>({ district: '', kadroUnvani: '' });
  const [originalJob, setOriginalJob] = useState<JobForm | null>(null);
  const [detailForm, setDetailForm] = useState<DetailForm>({ tcKimlikNo: '', fatherName: '', motherName: '', birthPlace: '', education: '', kurumSicil: '' });
  const [originalDetail, setOriginalDetail] = useState<DetailForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const u = user as any;
    const basic: BasicForm = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: normalizePhone(u.phone || ''),
      gender: u.gender || '',
      birthDate: formatBirthDate(u.birthDate),
    };
    const job: JobForm = { district: u.district || '', kadroUnvani: u.kadroUnvani || '' };
    const detail: DetailForm = {
      tcKimlikNo: u.tcKimlikNo || '', fatherName: u.fatherName || '',
      motherName: u.motherName || '', birthPlace: u.birthPlace || '',
      education: u.education || '', kurumSicil: u.kurumSicil || '',
    };
    setBasicForm(basic); setOriginalBasic(basic);
    setJobForm(job); setOriginalJob(job);
    setDetailForm(detail); setOriginalDetail(detail);
  }, [user]);

  const hasChanges = useMemo(() => {
    const bChanged = originalBasic ? (Object.keys(basicForm) as (keyof BasicForm)[]).some(k => basicForm[k] !== originalBasic[k]) : false;
    const jChanged = originalJob ? (Object.keys(jobForm) as (keyof JobForm)[]).some(k => jobForm[k] !== originalJob[k]) : false;
    const dChanged = originalDetail ? (Object.keys(detailForm) as (keyof DetailForm)[]).some(k => detailForm[k] !== originalDetail[k]) : false;
    return bChanged || jChanged || dChanged;
  }, [basicForm, jobForm, detailForm, originalBasic, originalJob, originalDetail]);

  const updateBasic = useCallback((f: keyof BasicForm, v: string) => {
    setBasicForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: '' }));
  }, []);
  const updateJob = useCallback((f: keyof JobForm, v: string) => {
    setJobForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: '' }));
  }, []);
  const updateDetail = useCallback((f: keyof DetailForm, v: string) => {
    setDetailForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: '' }));
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!basicForm.firstName.trim()) e.firstName = 'Ad gereklidir';
    if (!basicForm.lastName.trim()) e.lastName = 'Soyad gereklidir';
    const rawPhone = basicForm.phone.replace(/\s/g, '');
    if (rawPhone && rawPhone.length !== 10) e.phone = 'Telefon 10 haneli olmalıdır';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!hasChanges) { setIsEditing(false); return; }
    setSaving(true);
    try {
      const changed: Record<string, any> = {};
      if (originalBasic) (Object.keys(basicForm) as (keyof BasicForm)[]).forEach(k => { if (basicForm[k] !== originalBasic[k]) changed[k] = basicForm[k]; });
      if (originalJob) (Object.keys(jobForm) as (keyof JobForm)[]).forEach(k => { if (jobForm[k] !== originalJob[k]) changed[k] = jobForm[k]; });
      if (originalDetail) (Object.keys(detailForm) as (keyof DetailForm)[]).forEach(k => { if (detailForm[k] !== originalDetail[k]) changed[k] = detailForm[k]; });
      await ApiService.updateProfile(changed);
      await refreshUser?.();
      setIsEditing(false);
      Alert.alert('Başarılı ✓', 'Profiliniz güncellendi.');
    } catch (error: any) {
      Alert.alert('Hata', getUserFriendlyErrorMessage(error, 'Güncellenemedi. Tekrar deneyin.'));
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (!hasChanges) { setIsEditing(false); return; }
    Alert.alert('Değişiklikler kaybolacak', 'Yaptığınız değişiklikleri iptal etmek istediğinizden emin misiniz?', [
      { text: 'Devam Et', style: 'cancel' },
      { text: 'Vazgeç', style: 'destructive', onPress: () => {
        if (originalBasic) setBasicForm(originalBasic);
        if (originalJob) setJobForm(originalJob);
        if (originalDetail) setDetailForm(originalDetail);
        setErrors({}); setIsEditing(false);
      }},
    ]);
  };

  const phoneDisplay = formatPhoneDisplay((user as any)?.phone || '');

  /* ══════════════ RENDER ══════════════ */
  return (
    <SafeAreaView style={st.screen} edges={['top']}>
      {/* ── Top Bar ── */}
      <LinearGradient colors={['#312e81', '#4f46e5', '#6366f1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.topBar}>
        <TouchableOpacity onPress={() => isEditing ? handleCancel() : navigation.goBack()} style={st.topBtn} activeOpacity={0.7}>
          <Feather name={isEditing ? 'x' : 'arrow-left'} size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={st.topTitle}>{isEditing ? 'Profili Düzenle' : 'Profilim'}</Text>

        {!isEditing ? (
          <TouchableOpacity style={st.topEditBtn} onPress={() => setIsEditing(true)} activeOpacity={0.7}>
            <Feather name="edit-3" size={15} color="#fff" />
            <Text style={st.topEditBtnText}>Düzenle</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </LinearGradient>

      {/* ── Content ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isEditing ? 100 : 40, paddingTop: 4 }} keyboardShouldPersistTaps="handled">
          {!isEditing ? (
            /* ════════════ GÖRÜNTÜLEME ════════════ */
            <>
              {/* Avatar bölümü */}
              <View style={st.avatarSection}>
                <LinearGradient colors={['#6366f1', '#4f46e5']} style={st.avatarCircle}>
                  <Text style={st.avatarLetter}>{user?.firstName?.[0]?.toUpperCase() || 'U'}</Text>
                </LinearGradient>
                <Text style={st.avatarName}>
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Kullanıcı'}
                </Text>
                <Text style={st.avatarEmail}>{user?.email}</Text>
              </View>

              <SectionCard icon="user" title="Kişisel Bilgiler">
                <InfoRow icon="user" label="AD" value={user?.firstName} />
                <InfoRow icon="user" label="SOYAD" value={user?.lastName} />
                <InfoRow icon="phone" label="TELEFON" value={phoneDisplay ? `+90 ${phoneDisplay}` : undefined} />
                <InfoRow icon="users" label="CİNSİYET" value={(user as any)?.gender === 'male' ? 'Erkek' : (user as any)?.gender === 'female' ? 'Kadın' : undefined} />
                <InfoRow icon="calendar" label="DOĞUM TARİHİ" value={displayDate(basicForm.birthDate)} last />
              </SectionCard>

              <SectionCard icon="briefcase" title="Görev Bilgileri">
                <InfoRow icon="map-pin" label="GÖREV İLÇESİ" value={(user as any)?.district} />
                <InfoRow icon="award" label="KADRO ÜNVANI" value={(user as any)?.kadroUnvani} last />
              </SectionCard>

              <SectionCard icon="file-text" title="Detaylı Bilgiler" badge={!isActive ? 'ONAY BEKLİYOR' : undefined}>
                <InfoRow icon="credit-card" label="TC KİMLİK NO" value={(user as any)?.tcKimlikNo} />
                <InfoRow icon="user" label="BABA ADI" value={(user as any)?.fatherName} />
                <InfoRow icon="user" label="ANNE ADI" value={(user as any)?.motherName} />
                <InfoRow icon="map-pin" label="DOĞUM YERİ" value={(user as any)?.birthPlace} />
                <InfoRow icon="book-open" label="EĞİTİM DURUMU" value={EDUCATION_LEVEL_OPTIONS.find(o => o.value === (user as any)?.education)?.label} />
                <InfoRow icon="hash" label="KURUM SİCİL NO" value={(user as any)?.kurumSicil} last />
              </SectionCard>
            </>
          ) : (
            /* ════════════ DÜZENLEME ════════════ */
            <>
              {/* Kişisel Bilgiler */}
              <SectionCard icon="user" title="Kişisel Bilgiler">
                <View style={st.formPad}>
                  <CustomInput label="Ad" value={basicForm.firstName} onChangeText={v => updateBasic('firstName', v)} placeholder="Adınız" error={errors.firstName} required />
                  <CustomInput label="Soyad" value={basicForm.lastName} onChangeText={v => updateBasic('lastName', v)} placeholder="Soyadınız" error={errors.lastName} required />

                  {/* Telefon +90 */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={pf.label}>Telefon</Text>
                    <View style={[st.phoneRow, !!errors.phone && st.phoneRowErr]}>
                      <View style={st.phoneFlag}>
                        <Text style={st.phoneFlagTxt}>🇹🇷</Text>
                      </View>
                      <Text style={st.phoneCode}>+90</Text>
                      <View style={st.phoneSep} />
                      <TextInput
                        style={st.phoneInput}
                        value={formatPhoneDisplay(basicForm.phone)}
                        onChangeText={v => {
                          const digits = v.replace(/\D/g, '').slice(0, 10);
                          updateBasic('phone', digits);
                        }}
                        placeholder="5XX XXX XX XX"
                        placeholderTextColor="#94a3b8"
                        keyboardType="number-pad"
                        maxLength={13}
                      />
                    </View>
                    {errors.phone ? <Text style={st.fieldError}>{errors.phone}</Text> : null}
                  </View>

                  <PickerField label="Cinsiyet" icon="users" value={basicForm.gender === 'male' ? 'Erkek' : basicForm.gender === 'female' ? 'Kadın' : undefined} placeholder="Seçiniz..." onPress={() => setGenderVisible(true)} />

                  <PickerField label="Doğum Tarihi" icon="calendar" value={displayDate(basicForm.birthDate)} placeholder="Tarih seçiniz..." onPress={() => setShowDatePicker(true)} />

                  <BirthDatePickerModal
                    visible={showDatePicker}
                    initialDate={basicForm.birthDate || undefined}
                    onClose={() => setShowDatePicker(false)}
                    onSave={d => { updateBasic('birthDate', d); setShowDatePicker(false); }}
                  />
                </View>
              </SectionCard>

              {/* Görev Bilgileri */}
              <SectionCard icon="briefcase" title="Görev Bilgileri">
                <View style={st.formPad}>
                  <PickerField label="Görev İlçesi" icon="map-pin" value={jobForm.district || undefined} placeholder="İlçe seçiniz..." onPress={() => setDistrictVisible(true)} />
                  <CustomInput label="Kadro Ünvanı" value={jobForm.kadroUnvani} onChangeText={v => updateJob('kadroUnvani', v)} placeholder="Örn: Vaiz, Müezzin, İmam" />
                </View>
              </SectionCard>

              {/* Detaylı Bilgiler */}
              <SectionCard icon="file-text" title="Detaylı Bilgiler">
                <View style={st.formPad}>
                  <CustomInput label="TC Kimlik No" value={detailForm.tcKimlikNo} onChangeText={v => updateDetail('tcKimlikNo', v.replace(/\D/g, '').slice(0, 11))} placeholder="11 haneli TC kimlik no" keyboardType="numeric" />
                  <CustomInput label="Baba Adı" value={detailForm.fatherName} onChangeText={v => updateDetail('fatherName', v)} placeholder="Babanızın adı" />
                  <CustomInput label="Anne Adı" value={detailForm.motherName} onChangeText={v => updateDetail('motherName', v)} placeholder="Annenizin adı" />
                  <CustomInput label="Doğum Yeri" value={detailForm.birthPlace} onChangeText={v => updateDetail('birthPlace', v)} placeholder="Doğduğunuz şehir" />
                  <PickerField label="Eğitim Durumu" icon="book-open" value={EDUCATION_LEVEL_OPTIONS.find(o => o.value === detailForm.education)?.label} placeholder="Seçiniz..." onPress={() => setEducationVisible(true)} />
                  <CustomInput label="Kurum Sicil No" value={detailForm.kurumSicil} onChangeText={v => updateDetail('kurumSicil', v)} placeholder="Kurum sicil numaranız" />
                </View>
              </SectionCard>
            </>
          )}
        </ScrollView>

        {/* ── Sticky Save Bar ── */}
        {isEditing && (
          <View style={st.stickyBar}>
            <TouchableOpacity style={st.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
              <Text style={st.cancelBtnText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.saveBtn, (!hasChanges || saving) && st.saveBtnOff]}
              onPress={handleSave}
              disabled={saving || !hasChanges}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LinearGradient colors={['#6366f1', '#4f46e5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.saveBtnGrad}>
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={st.saveBtnText}>Değişiklikleri Kaydet</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ══════════ MODALS ══════════ */}

      {/* Cinsiyet */}
      <Modal visible={genderVisible} transparent animationType="slide" onRequestClose={() => setGenderVisible(false)} statusBarTranslucent>
        <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={() => setGenderVisible(false)}>
          <View style={st.sheet} onStartShouldSetResponder={() => true}>
            <View style={st.handle} />
            <View style={st.sheetHead}><Text style={st.sheetTitle}>Cinsiyet</Text>
              <TouchableOpacity onPress={() => setGenderVisible(false)} style={st.sheetX}><Feather name="x" size={18} color="#94a3b8" /></TouchableOpacity>
            </View>
            {[{ label: 'Erkek', value: 'male' }, { label: 'Kadın', value: 'female' }].map(opt => {
              const sel = basicForm.gender === opt.value;
              return (
                <TouchableOpacity key={opt.value} style={[st.sheetRow, sel && st.sheetRowSel]} onPress={() => { updateBasic('gender', opt.value); setGenderVisible(false); }}>
                  <Text style={[st.sheetRowTxt, sel && st.sheetRowTxtSel]}>{opt.label}</Text>
                  {sel && <Feather name="check-circle" size={18} color="#6366f1" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* İlçe — koyu tema */}
      <Modal visible={districtVisible} transparent animationType="slide" onRequestClose={() => setDistrictVisible(false)} statusBarTranslucent>
        <TouchableOpacity style={st.dOverlay} activeOpacity={1} onPress={() => setDistrictVisible(false)}>
          <View style={st.dSheet} onStartShouldSetResponder={() => true}>
            <View style={st.dHandle} />
            <View style={st.dHead}><Text style={st.dTitle}>Görev İlçesi</Text>
              <TouchableOpacity onPress={() => setDistrictVisible(false)} style={st.dClose}><Feather name="x" size={18} color="rgba(148,163,184,0.7)" /></TouchableOpacity>
            </View>
            <FlatList data={KONYA_DISTRICTS} keyExtractor={i => i} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={st.dList}
              renderItem={({ item }) => {
                const sel = jobForm.district === item;
                return (
                  <TouchableOpacity style={[st.dItem, sel && st.dItemSel]} onPress={() => { updateJob('district', item); setDistrictVisible(false); }}>
                    <Text style={[st.dItemTxt, sel && st.dItemTxtSel]}>{item}</Text>
                    {sel && <Feather name="check" size={15} color="#60a5fa" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Eğitim */}
      <Modal visible={educationVisible} transparent animationType="slide" onRequestClose={() => setEducationVisible(false)} statusBarTranslucent>
        <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={() => setEducationVisible(false)}>
          <View style={st.sheet} onStartShouldSetResponder={() => true}>
            <View style={st.handle} />
            <View style={st.sheetHead}><Text style={st.sheetTitle}>Eğitim Durumu</Text>
              <TouchableOpacity onPress={() => setEducationVisible(false)} style={st.sheetX}><Feather name="x" size={18} color="#94a3b8" /></TouchableOpacity>
            </View>
            {EDUCATION_LEVEL_OPTIONS.map(opt => {
              const sel = detailForm.education === opt.value;
              return (
                <TouchableOpacity key={opt.value} style={[st.sheetRow, sel && st.sheetRowSel]} onPress={() => { updateDetail('education', opt.value); setEducationVisible(false); }}>
                  <Text style={[st.sheetRowTxt, sel && st.sheetRowTxtSel]}>{opt.label}</Text>
                  {sel && <Feather name="check-circle" size={18} color="#6366f1" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
/*                              STİLLER                                 */
/* ══════════════════════════════════════════════════════════════════════ */

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },

  /* Top bar */
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
  },
  topBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  topEditBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  topEditBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  /* Avatar section (view mode) */
  avatarSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: { fontSize: 28, fontWeight: '800', color: '#fff' },
  avatarName: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  avatarEmail: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

  /* Form */
  formPad: { padding: 18 },

  /* Phone field */
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    height: 50, overflow: 'hidden',
  },
  phoneRowErr: { borderColor: '#f87171' },
  phoneFlag: { paddingLeft: 14, paddingRight: 6, justifyContent: 'center' },
  phoneFlagTxt: { fontSize: 18 },
  phoneCode: { fontSize: 15, fontWeight: '700', color: '#475569', marginRight: 2 },
  phoneSep: { width: 1, height: 24, backgroundColor: '#cbd5e1', marginHorizontal: 10 },
  phoneInput: { flex: 1, fontSize: 15, color: '#1e293b', fontWeight: '500', paddingRight: 16 },
  fieldError: { fontSize: 12, color: '#ef4444', marginTop: 4, marginLeft: 4 },

  /* Sticky save bar */
  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e2e8f0',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12,
    elevation: 8,
  },
  cancelBtn: {
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  saveBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  saveBtnOff: { opacity: 0.45 },
  saveBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* Light sheet modal */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  handle: { width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f1f5f9',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  sheetX: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, marginHorizontal: 8, borderRadius: 14, marginBottom: 2,
  },
  sheetRowSel: { backgroundColor: '#eef2ff' },
  sheetRowTxt: { fontSize: 15, color: '#475569', fontWeight: '500' },
  sheetRowTxtSel: { color: '#4f46e5', fontWeight: '700' },

  /* Dark district modal */
  dOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  dSheet: {
    backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, maxHeight: '70%',
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
  },
  dHandle: { width: 36, height: 4, backgroundColor: 'rgba(148,163,184,0.3)', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  dHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(59,130,246,0.12)',
  },
  dTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
  dClose: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  dList: { paddingHorizontal: 12, paddingTop: 8 },
  dItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginBottom: 2,
  },
  dItemSel: { backgroundColor: 'rgba(59,130,246,0.15)' },
  dItemTxt: { fontSize: 15, color: 'rgba(241,245,249,0.75)', fontWeight: '400' },
  dItemTxtSel: { color: '#60a5fa', fontWeight: '600' },
});
