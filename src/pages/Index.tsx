import ParticleField from '@/components/ParticleField';
import HeroSection from '@/components/sections/HeroSection';
import ThesisSection from '@/components/sections/ThesisSection';
import StackSection from '@/components/sections/StackSection';
import FrameworksSection from '@/components/sections/FrameworksSection';
import WorkSection from '@/components/sections/WorkSection';
import ProfileSection from '@/components/sections/ProfileSection';
import CloseSection from '@/components/sections/CloseSection';
import VaultIcon from '@/components/VaultIcon';

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <ParticleField />
      <VaultIcon />
      <main>
        <HeroSection />
        <ThesisSection />
        <StackSection />
        <FrameworksSection />
        <WorkSection />
        <ProfileSection />
        <CloseSection />
      </main>
    </div>
  );
};

export default Index;
