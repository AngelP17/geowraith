import React from 'react';
import type { IconProps } from '@tabler/icons-react';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowRight,
  IconBell,
  IconBellRinging2,
  IconBolt,
  IconBook,
  IconBrain,
  IconBrandGithub,
  IconBuilding,
  IconBuildingMonument,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconClock,
  IconCode,
  IconCopy,
  IconCpu,
  IconCrosshair,
  IconCurrencyDollar,
  IconDatabase,
  IconExternalLink,
  IconEyeOff,
  IconFileX,
  IconGlobe,
  IconHelpCircle,
  IconHome,
  IconKey,
  IconLayersIntersect2,
  IconLifebuoy,
  IconLink,
  IconLoader2,
  IconLock,
  IconMail,
  IconMap,
  IconMapPin,
  IconMaximize,
  IconMenu,
  IconMicroscope,
  IconMinus,
  IconMountain,
  IconNavigation,
  IconNews,
  IconPhoto,
  IconPlayerPlay,
  IconPlus,
  IconRadar,
  IconRadio,
  IconRoute,
  IconSatellite,
  IconScale,
  IconScan,
  IconSchool,
  IconSearch,
  IconSend,
  IconServer,
  IconShield,
  IconShieldCheck,
  IconTarget,
  IconTerminal,
  IconTrees,
  IconTrophy,
  IconUmbrella,
  IconUpload,
  IconWifiOff,
  IconX,
} from '@tabler/icons-react';

interface LucideProps extends Omit<IconProps, 'stroke'> {
  stroke?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
}

export type LucideIcon = React.ComponentType<LucideProps>;

function adaptIcon(IconComponent: React.ComponentType<IconProps>): LucideIcon {
  const CompatIcon: React.FC<LucideProps> = ({ strokeWidth, stroke, ...props }) => {
    return <IconComponent stroke={strokeWidth ?? stroke} {...props} />;
  };

  return CompatIcon;
}

export const AlertCircle = adaptIcon(IconAlertCircle);
export const AlertTriangle = adaptIcon(IconAlertTriangle);
export const ArrowRight = adaptIcon(IconArrowRight);
export const Bell = adaptIcon(IconBell);
export const BookOpen = adaptIcon(IconBook);
export const Brain = adaptIcon(IconBrain);
export const Building2 = adaptIcon(IconBuilding);
export const Check = adaptIcon(IconCheck);
export const CheckCircle = adaptIcon(IconCircleCheck);
export const CheckCircle2 = adaptIcon(IconCircleCheck);
export const ChevronDown = adaptIcon(IconChevronDown);
export const ChevronRight = adaptIcon(IconChevronRight);
export const Clock = adaptIcon(IconClock);
export const Code2 = adaptIcon(IconCode);
export const Copy = adaptIcon(IconCopy);
export const Cpu = adaptIcon(IconCpu);
export const Crosshair = adaptIcon(IconCrosshair);
export const Database = adaptIcon(IconDatabase);
export const DollarSign = adaptIcon(IconCurrencyDollar);
export const ExternalLink = adaptIcon(IconExternalLink);
export const EyeOff = adaptIcon(IconEyeOff);
export const FileX = adaptIcon(IconFileX);
export const Github = adaptIcon(IconBrandGithub);
export const Globe = adaptIcon(IconGlobe);
export const GraduationCap = adaptIcon(IconSchool);
export const HelpCircle = adaptIcon(IconHelpCircle);
export const Home = adaptIcon(IconHome);
export const Image = adaptIcon(IconPhoto);
export const Key = adaptIcon(IconKey);
export const Landmark = adaptIcon(IconBuildingMonument);
export const Layers = adaptIcon(IconLayersIntersect2);
export const LifeBuoy = adaptIcon(IconLifebuoy);
export const Link2 = adaptIcon(IconLink);
export const Loader2 = adaptIcon(IconLoader2);
export const Lock = adaptIcon(IconLock);
export const Mail = adaptIcon(IconMail);
export const MapPin = adaptIcon(IconMapPin);
export const Map = adaptIcon(IconMap);
export const Maximize2 = adaptIcon(IconMaximize);
export const Menu = adaptIcon(IconMenu);
export const Microscope = adaptIcon(IconMicroscope);
export const Minus = adaptIcon(IconMinus);
export const Mountain = adaptIcon(IconMountain);
export const Navigation = adaptIcon(IconNavigation);
export const Newspaper = adaptIcon(IconNews);
export const Play = adaptIcon(IconPlayerPlay);
export const Plus = adaptIcon(IconPlus);
export const Radar = adaptIcon(IconRadar);
export const Radio = adaptIcon(IconRadio);
export const Route = adaptIcon(IconRoute);
export const Satellite = adaptIcon(IconSatellite);
export const Scale = adaptIcon(IconScale);
export const Scan = adaptIcon(IconScan);
export const Search = adaptIcon(IconSearch);
export const Send = adaptIcon(IconSend);
export const Server = adaptIcon(IconServer);
export const Shield = adaptIcon(IconShield);
export const ShieldCheck = adaptIcon(IconShieldCheck);
export const Siren = adaptIcon(IconBellRinging2);
export const Target = adaptIcon(IconTarget);
export const Terminal = adaptIcon(IconTerminal);
export const Trees = adaptIcon(IconTrees);
export const Trophy = adaptIcon(IconTrophy);
export const Umbrella = adaptIcon(IconUmbrella);
export const Upload = adaptIcon(IconUpload);
export const WifiOff = adaptIcon(IconWifiOff);
export const X = adaptIcon(IconX);
export const Zap = adaptIcon(IconBolt);
