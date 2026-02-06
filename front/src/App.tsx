import { useState, useEffect } from "react";
import { TopNavigation } from "./components/TopNavigation";
import { ImageSlider } from "./components/ImageSlider";
import { QuickAccessGrid } from "./components/QuickAccessGrid";
import { AnnouncementSection } from "./components/AnnouncementSection";
import { BottomNavigation } from "./components/BottomNavigation";
import { IslamicTileBackground } from "./components/IslamicTileBackground";
import { AllAnnouncementsPage } from "./components/AllAnnouncementsPage";
import { CoursesPage } from "./components/CoursesPage";
import { CourseDetailPage } from "./components/CourseDetailPage";
import { BranchesPage } from "./components/BranchesPage";
import { BranchDetailPage } from "./components/BranchDetailPage";
import { MembershipPage } from "./components/MembershipPage";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { NewsPage } from "./components/NewsPage";
import { ContactPage } from "./components/ContactPage";
import { PartnerInstitutionsPage } from "./components/PartnerInstitutionsPage";
import { PartnerDetailPage } from "./components/PartnerDetailPage";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { MuktesepPage } from "./components/MuktesepPage";
import { DistrictRepresentativePage } from "./components/DistrictRepresentativePage";
import { PendingApprovalPage } from "./components/PendingApprovalPage";
import { RejectedPage } from "./components/RejectedPage";
import { WelcomePage } from "./components/WelcomePage";
import { AuthProvider, useAuth } from "./context/AuthContext";

type Page = "welcome" | "home" | "announcements" | "courses" | "courseDetail" | "branches" | "branchDetail" | "membership" | "login" | "signup" | "news" | "contact" | "partners" | "partnerDetail" | "muktesep" | "districtRep" | "pendingApproval" | "rejected";
type Tab = "home" | "courses" | "branches";

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("welcome");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedCourse, setSelectedCourse] = useState<{ trainingId: string; lessonId: string } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  
  const { status, isActive, isPendingDetails, isAuthenticated, isLoading } = useAuth();

  // Kullanıcı durumuna göre başlangıç sayfasını ayarla
  useEffect(() => {
    if (isLoading) return;
    
    if (isAuthenticated) {
      // Giriş yapmış kullanıcı - durumuna göre yönlendir
      if (status === 'pending_branch_review' || status === 'pending_admin_approval') {
        setCurrentPage("pendingApproval");
      } else if (status === 'rejected') {
        setCurrentPage("rejected");
      } else {
        // pending_details veya active - ana sayfaya
        // pending_details kullanıcılar ana sayfadan Aşama 2'ye geçebilir
        setCurrentPage("home");
      }
    } else {
      // Giriş yapmamış - welcome sayfası
      setCurrentPage("welcome");
    }
  }, [isAuthenticated, isLoading, status]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "home") {
      setCurrentPage("home");
    } else if (tab === "courses") {
      setCurrentPage("courses");
    } else if (tab === "branches") {
      setCurrentPage("branches");
    }
  };

  const handleCourseSelect = (trainingId: string, lessonId: string) => {
    setSelectedCourse({ trainingId, lessonId });
    setCurrentPage("courseDetail");
  };

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId);
    setCurrentPage("branchDetail");
  };

  const handlePartnerSelect = (partnerId: string) => {
    setSelectedPartner(partnerId);
    setCurrentPage("partnerDetail");
  };

  const handleBackToCourses = () => {
    setCurrentPage("courses");
    setSelectedCourse(null);
  };

  const handleBackToBranches = () => {
    setCurrentPage("branches");
    setSelectedBranch(null);
  };

  const handleBackToPartners = () => {
    setCurrentPage("partners");
    setSelectedPartner(null);
  };

  const handleBackToHome = () => {
    setCurrentPage("home");
    setActiveTab("home");
  };

  const handleLoginSuccess = () => {
    toast.success("Başarıyla giriş yapıldı");
    
    // Kullanıcı durumuna göre yönlendirme
    if (status === 'pending_branch_review' || status === 'pending_admin_approval') {
      // Onay bekliyor
      setCurrentPage("pendingApproval");
    } else if (status === 'rejected') {
      // Reddedilmiş
      setCurrentPage("rejected");
    } else {
      // pending_details veya active - ana sayfaya
      // pending_details kullanıcılar ana sayfadan Aşama 2'ye geçebilir
      setCurrentPage("home");
    }
  };

  const handleLogout = () => {
    toast.success("Çıkış yapıldı");
    setCurrentPage("welcome");
  };

  // Loading durumu
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Welcome sayfası - giriş yapmamış kullanıcılar
  if (currentPage === "welcome") {
    return (
      <>
        <WelcomePage 
          onLoginClick={() => setCurrentPage("login")}
          onSignupClick={() => setCurrentPage("signup")}
        />
        <Toaster />
      </>
    );
  }

  if (currentPage === "announcements") {
    return (
      <>
        <AllAnnouncementsPage onBack={handleBackToHome} />
        <Toaster />
      </>
    );
  }

  if (currentPage === "news") {
    return (
      <>
        <NewsPage onBack={handleBackToHome} />
        <Toaster />
      </>
    );
  }

  if (currentPage === "contact") {
    return (
      <>
        <ContactPage onBack={handleBackToHome} />
        <Toaster />
      </>
    );
  }

  if (currentPage === "membership") {
    return (
      <>
        <MembershipPage 
          onBack={handleBackToHome}
          onLoginClick={() => setCurrentPage("login")}
          onSuccess={() => setCurrentPage("pendingApproval")}
        />
        <Toaster />
      </>
    );
  }

  if (currentPage === "login") {
    return (
      <>
        <LoginPage 
          onBack={() => setCurrentPage("welcome")}
          onSignupClick={() => setCurrentPage("signup")}
          onLoginSuccess={handleLoginSuccess}
        />
        <Toaster />
      </>
    );
  }

  if (currentPage === "signup") {
    return (
      <>
        <SignupPage 
          onBack={() => setCurrentPage("welcome")}
          onLoginClick={() => setCurrentPage("login")}
          onRegistrationSuccess={() => setCurrentPage("home")}
        />
        <Toaster />
      </>
    );
  }

  if (currentPage === "pendingApproval") {
    return (
      <>
        <PendingApprovalPage onBack={handleBackToHome} />
        <Toaster />
      </>
    );
  }

  if (currentPage === "rejected") {
    return (
      <>
        <RejectedPage onBack={handleBackToHome} />
        <Toaster />
      </>
    );
  }

  if (currentPage === "courses") {
    return (
      <>
        <CoursesPage 
          onBack={handleBackToHome} 
          onCourseSelect={handleCourseSelect}
        />
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </>
    );
  }

  if (currentPage === "courseDetail" && selectedCourse) {
    return (
      <>
        <CourseDetailPage
          trainingId={selectedCourse.trainingId}
          lessonId={selectedCourse.lessonId}
          onBack={handleBackToCourses}
        />
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </>
    );
  }

  if (currentPage === "branches") {
    return (
      <>
        <BranchesPage 
          onBack={handleBackToHome} 
          onBranchSelect={handleBranchSelect}
        />
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </>
    );
  }

  if (currentPage === "branchDetail" && selectedBranch) {
    return (
      <>
        <BranchDetailPage
          branchId={selectedBranch}
          onBack={handleBackToBranches}
        />
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </>
    );
  }

  if (currentPage === "partners") {
    return (
      <>
        <PartnerInstitutionsPage
          onBack={handleBackToHome}
          onPartnerSelect={handlePartnerSelect}
        />
        <Toaster />
      </>
    );
  }

  if (currentPage === "partnerDetail" && selectedPartner) {
    return (
      <>
        <PartnerDetailPage
          partnerId={selectedPartner}
          onBack={handleBackToPartners}
        />
        <Toaster />
      </>
    );
  }

  if (currentPage === "districtRep") {
    return (
      <>
        <DistrictRepresentativePage onBack={handleBackToHome} />
        <Toaster />
      </>
    );
  }

  if (currentPage === "muktesep") {
    return (
      <>
        <MuktesepPage onBack={handleBackToHome} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="relative h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 overflow-hidden">
      {/* Real Islamic tile art background images */}
      <IslamicTileBackground />
      
      {/* Clean header */}
      <TopNavigation 
        onLogout={handleLogout} 
        onDistrictRepClick={() => setCurrentPage("districtRep")} 
      />
      
      {/* Main content */}
      <div className="relative z-10">
        <ImageSlider />
        <QuickAccessGrid 
          onMembershipClick={() => setCurrentPage("membership")} 
          onNewsClick={() => setCurrentPage("news")}
          onContactClick={() => setCurrentPage("contact")}
          onPartnerInstitutionsClick={() => setCurrentPage("partners")}
          onMuktesepClick={() => setCurrentPage("muktesep")}
        />
        <AnnouncementSection onViewAll={() => setCurrentPage("announcements")} />
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Bottom fade for navbar */}
      <div className="absolute bottom-16 left-0 right-0 h-20 bg-gradient-to-t from-slate-50/90 to-transparent pointer-events-none z-0"></div>
      
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
