// Teacher Profile Enhancement Components
// Use these to showcase teacher quality and vetting to parents

export { default as TierBadge, TierTooltip } from './TierBadge';
export { default as TeacherStatsDisplay, StatBadge } from './TeacherStatsDisplay';
export { default as SpecializationTags, SpecializationSelector } from './SpecializationTags';
export { default as GentlenessGuarantee, GentlenessBadge } from './GentlenessGuarantee';
export { default as VettingBadges, TrustBanner, VerifiedBadge } from './VettingBadges';
export { default as EnhancedTeacherCard, CompactTeacherCard } from './EnhancedTeacherCard';
export { default as CareerLadder, TierProgressBar } from './CareerLadder';
export { default as VideoIntroPlayer, VideoIntroPlaceholder } from './VideoIntroPlayer';
export { default as TestimonialCard, TestimonialsList, NoTestimonials } from './TestimonialCard';
export { default as FeaturedRibbon, AnimatedFeaturedRibbon, TopTeacherBadge } from './FeaturedRibbon';
export { default as TeacherProfileModal } from './TeacherProfileModal';

// Re-export constants for convenience
export {
  TEACHER_TIERS,
  TEACHER_SPECIALIZATIONS,
  VETTING_BADGES,
  GENTLENESS_GUARANTEE,
  getTierInfo,
  getSpecialization,
  formatHoursTaught,
  getRatingDisplay
} from '../../constants/teacherConstants';
