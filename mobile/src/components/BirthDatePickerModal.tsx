// BirthDatePickerModal - Scroll-wheel tarih seçici (dark tema - signup ile uyumlu)
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/* ─── Sabitler ─── */
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const getDaysInMonth = (month: number, year: number): number =>
  new Date(year, month, 0).getDate();

const generateYears = (): number[] => {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= 1920; y--) years.push(y);
  return years;
};

const YEARS = generateYears();

/* ─── WheelColumn ─── */
interface WheelColumnProps {
  data: { label: string; value: number }[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  columnWidth: number;
}

const WheelColumn: React.FC<WheelColumnProps> = ({
  data,
  selectedIndex,
  onIndexChange,
  columnWidth,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const prevLen = useRef(data.length);

  // Dışarıdan gelen index değiştiğinde scroll'u hizala
  useEffect(() => {
    const animated = prevLen.current === data.length;
    prevLen.current = data.length;
    const timer = setTimeout(() => {
      if (!isScrolling.current) {
        scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedIndex, data.length]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = false;
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.min(Math.max(Math.round(y / ITEM_HEIGHT), 0), data.length - 1);
      onIndexChange(idx);
    },
    [data.length, onIndexChange],
  );

  return (
    <View style={{ width: columnWidth, height: PICKER_HEIGHT, overflow: 'hidden' }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        nestedScrollEnabled
        onScrollBeginDrag={() => { isScrolling.current = true; }}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
        }}
      >
        {data.map((item, index) => {
          const dist = Math.abs(index - selectedIndex);
          const isSelected = dist === 0;
          const opacity = isSelected ? 1 : dist === 1 ? 0.4 : dist === 2 ? 0.18 : 0.08;
          const fontSize = isSelected ? 20 : dist === 1 ? 16 : 14;

          return (
            <View key={`${item.value}-${index}`} style={wheelStyles.item}>
              <Text
                style={[
                  wheelStyles.text,
                  { opacity, fontSize },
                  isSelected && wheelStyles.textSelected,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const wheelStyles = StyleSheet.create({
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'rgba(148,163,184,0.9)',
    fontWeight: '500',
  },
  textSelected: {
    color: '#f1f5f9',
    fontWeight: '700',
  },
});

/* ─── BirthDatePickerModal ─── */
export interface BirthDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (dateString: string) => void; // YYYY-MM-DD
  initialDate?: string; // YYYY-MM-DD
}

export const BirthDatePickerModal: React.FC<BirthDatePickerModalProps> = ({
  visible,
  onClose,
  onSave,
  initialDate,
}) => {
  const parseInitial = useCallback(() => {
    if (initialDate) {
      const p = initialDate.split('-').map(Number);
      if (p[0] && p[1] && p[2]) return { year: p[0], month: p[1], day: p[2] };
    }
    return { year: 1990, month: 1, day: 1 };
  }, [initialDate]);

  const [day, setDay] = useState(() => parseInitial().day);
  const [month, setMonth] = useState(() => parseInitial().month);
  const [year, setYear] = useState(() => parseInitial().year);

  useEffect(() => {
    if (visible) {
      const p = parseInitial();
      setDay(p.day);
      setMonth(p.month);
      setYear(p.year);
    }
  }, [visible, parseInitial]);

  const daysInMonth = getDaysInMonth(month, year);
  const dayData = Array.from({ length: daysInMonth }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }));
  const monthData = MONTHS_TR.map((m, i) => ({ label: m, value: i + 1 }));
  const yearData = YEARS.map((y) => ({ label: String(y), value: y }));

  // Gün ay/yıl değiştiğinde sınırla
  useEffect(() => {
    if (day > daysInMonth) setDay(daysInMonth);
  }, [month, year, daysInMonth, day]);

  const dayIdx = Math.max(0, dayData.findIndex((d) => d.value === day));
  const monthIdx = Math.max(0, monthData.findIndex((m) => m.value === month));
  const yearIdx = Math.max(0, yearData.findIndex((y) => y.value === year));

  const handleSave = () => {
    const yStr = String(year);
    const mStr = String(month).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    onSave(`${yStr}-${mStr}-${dStr}`);
  };

  const sw = Dimensions.get('window').width;
  // Gün: dar, Ay: geniş, Yıl: orta
  const dayW = Math.floor((sw - 64) * 0.22);
  const monthW = Math.floor((sw - 64) * 0.44);
  const yearW = Math.floor((sw - 64) * 0.34);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dışa tıklama overlay */}
      <TouchableOpacity
        style={s.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Sheet - dokunuş yukarı çıkmasın */}
        <View style={s.sheet} onStartShouldSetResponder={() => true}>

          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Doğum Tarihi</Text>
            <TouchableOpacity
              onPress={onClose}
              style={s.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={18} color="rgba(148,163,184,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Picker alanı */}
          <View style={s.pickerArea}>

            {/* Seçim highlight çubuğu — pointerEvents yok çünkü View */}
            <View style={s.highlight} pointerEvents="none">
              <View style={s.highlightInner} />
            </View>

            {/* Üst ve alt fade — View ile sarılı, pointerEvents='none' */}
            <View style={s.fadeTop} pointerEvents="none">
              <LinearGradient
                colors={['rgba(30,41,59,1)', 'rgba(30,41,59,0)']}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <View style={s.fadeBottom} pointerEvents="none">
              <LinearGradient
                colors={['rgba(30,41,59,0)', 'rgba(30,41,59,1)']}
                style={StyleSheet.absoluteFill}
              />
            </View>

            {/* Sütunlar */}
            <View style={s.columns}>
              <WheelColumn
                data={dayData}
                selectedIndex={dayIdx}
                onIndexChange={(i) => setDay(dayData[i]?.value ?? 1)}
                columnWidth={dayW}
              />
              <WheelColumn
                data={monthData}
                selectedIndex={monthIdx}
                onIndexChange={(i) => setMonth(monthData[i]?.value ?? 1)}
                columnWidth={monthW}
              />
              <WheelColumn
                data={yearData}
                selectedIndex={yearIdx}
                onIndexChange={(i) => setYear(yearData[i]?.value ?? 1990)}
                columnWidth={yearW}
              />
            </View>
          </View>

          {/* Kaydet butonu */}
          <TouchableOpacity
            style={s.saveBtn}
            activeOpacity={0.8}
            onPress={handleSave}
          >
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.saveBtnGradient}
            >
              <Text style={s.saveBtnText}>Kaydet</Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(148,163,184,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,130,246,0.12)',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerArea: {
    height: PICKER_HEIGHT,
    marginHorizontal: 20,
    marginVertical: 16,
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    zIndex: 1,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  highlightInner: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    zIndex: 2,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    zIndex: 2,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: PICKER_HEIGHT,
  },
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});

export default BirthDatePickerModal;
