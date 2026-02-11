import { useState } from "react";
import { ArrowLeft, Phone, Mail, MapPin, Clock, Send, User, MessageSquare, Building2, Facebook, Twitter, Instagram, Linkedin, Loader2 } from "lucide-react";
import { IslamicTileBackground } from "./IslamicTileBackground";
import { motion } from "motion/react";
import { toast } from "sonner";
import { contactService } from "../services/api";

interface ContactPageProps {
  onBack: () => void;
}

export function ContactPage({ onBack }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    setIsSubmitting(true);

    try {
      await contactService.createContactMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      });

      toast.success("Mesajınız başarıyla gönderildi!", {
        description: "En kısa sürede size dönüş yapacağız.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error: any) {
      console.error("Mesaj gönderilemedi:", error);
      toast.error("Mesaj gönderilemedi", {
        description: error.message || "Lütfen daha sonra tekrar deneyin.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Telefon",
      details: ["+90 (332) 123 45 67", "+90 (332) 123 45 68"],
      color: "from-blue-600 to-blue-700",
    },
    {
      icon: Mail,
      title: "E-posta",
      details: ["info@konyadingorevlileri.org", "destek@konyadingorevlileri.org"],
      color: "from-indigo-600 to-indigo-700",
    },
    {
      icon: MapPin,
      title: "Adres",
      details: ["Mevlana Mah. Selçuklu Cad.", "No: 42, 42000 Selçuklu/Konya"],
      color: "from-cyan-600 to-cyan-700",
    },
    {
      icon: Clock,
      title: "Çalışma Saatleri",
      details: ["Pazartesi - Cuma: 08:00 - 17:00", "Cumartesi: 09:00 - 13:00"],
      color: "from-blue-600 to-blue-700",
    },
  ];

  const socialMedia = [
    { icon: Facebook, name: "Facebook", color: "hover:bg-blue-600" },
    { icon: Twitter, name: "Twitter", color: "hover:bg-sky-500" },
    { icon: Instagram, name: "Instagram", color: "hover:bg-pink-600" },
    { icon: Linkedin, name: "LinkedIn", color: "hover:bg-blue-700" },
  ];

  const branches = [
    { name: "Selçuklu Şubesi", phone: "+90 (332) 123 45 67" },
    { name: "Meram Şubesi", phone: "+90 (332) 234 56 78" },
    { name: "Karatay Şubesi", phone: "+90 (332) 345 67 89" },
    { name: "Ereğli Şubesi", phone: "+90 (332) 456 78 90" },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pb-24">
      <IslamicTileBackground />
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-700 to-blue-800 shadow-lg shadow-blue-900/30 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-white hover:bg-white/10 rounded-xl transition-all hover:shadow-lg backdrop-blur-sm border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white text-xl">Bize Ulaşın</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section with Compact Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-blue-900/10 border border-white/80"
          >
            <h2 className="text-gray-900 mb-3 text-center">İletişime Geçin</h2>
            <p className="text-gray-600 text-center mb-5 text-sm">
              Sorularınız, önerileriniz veya görüşleriniz için bizimle iletişime geçebilirsiniz.
            </p>
            
            {/* Compact Contact Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <motion.div
                    key={info.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="flex gap-3"
                  >
                    <div className={`bg-gradient-to-br ${info.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 mb-1">{info.title}</p>
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-xs text-gray-600 leading-tight truncate" title={detail}>
                          {detail}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-blue-900/10 border border-white/80">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-gray-900">Mesaj Gönderin</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Ad Soyad *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Adınız ve soyadınız"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        E-posta *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="ornek@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Telefon
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="+90 (5XX) XXX XX XX"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Konu *
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none"
                        >
                          <option value="">Konu seçiniz</option>
                          <option value="membership">Üyelik</option>
                          <option value="courses">Eğitim Programları</option>
                          <option value="events">Etkinlikler</option>
                          <option value="support">Destek</option>
                          <option value="suggestion">Öneri</option>
                          <option value="complaint">Şikayet</option>
                          <option value="other">Diğer</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Mesajınız *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                      placeholder="Mesajınızı buraya yazın..."
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Gönderiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Mesaj Gönder</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              {/* Branch Phones */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-blue-900/10 border border-white/80">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-gray-900 text-sm">Şubelerimiz</h3>
                </div>
                <div className="space-y-3">
                  {branches.map((branch, index) => (
                    <motion.div
                      key={branch.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + 0.1 * index }}
                      className="p-3 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors"
                    >
                      <p className="text-sm text-gray-900 mb-1">{branch.name}</p>
                      <a
                        href={`tel:${branch.phone.replace(/\s/g, '')}`}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {branch.phone}
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-blue-900/10 border border-white/80">
                <h3 className="text-gray-900 text-sm mb-4">Sosyal Medya</h3>
                <div className="grid grid-cols-2 gap-3">
                  {socialMedia.map((social, index) => {
                    const Icon = social.icon;
                    return (
                      <motion.button
                        key={social.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 + 0.1 * index }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center justify-center gap-2 p-3 bg-gradient-to-br from-gray-700 to-gray-800 ${social.color} text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg`}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-lg shadow-blue-900/20 text-white">
                <h3 className="mb-3 text-sm">Hızlı Bilgi</h3>
                <p className="text-xs leading-relaxed opacity-90">
                  Mesajlarınıza en geç 24 saat içinde dönüş yapılmaktadır. 
                  Acil durumlar için lütfen telefon ile iletişime geçiniz.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
