import React from "react";
import { 
  Sun, 
  Moon, 
  CloudSun, 
  CloudMoon, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  Snowflake, 
  Wind 
} from "lucide-react";

interface WeatherIconProps {
  name: string;
  className?: string;
  size?: number;
  animate?: boolean;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ 
  name, 
  className = "w-6 h-6", 
  size,
  animate = false 
}) => {
  const iconProps = {
    className: `${className} ${animate ? "transition-transform duration-700" : ""}`,
    ...(size ? { size } : {})
  };

  switch (name) {
    case "Sun":
      return <Sun {...iconProps} className={`${iconProps.className} text-amber-400`} />;
    case "Moon":
      return <Moon {...iconProps} className={`${iconProps.className} text-indigo-200`} />;
    case "CloudSun":
      return <CloudSun {...iconProps} className={`${iconProps.className} text-amber-300`} />;
    case "CloudMoon":
      return <CloudMoon {...iconProps} className={`${iconProps.className} text-indigo-300`} />;
    case "Cloud":
      return <Cloud {...iconProps} className={`${iconProps.className} text-slate-300`} />;
    case "CloudFog":
      return <CloudFog {...iconProps} className={`${iconProps.className} text-slate-400`} />;
    case "CloudDrizzle":
      return <CloudDrizzle {...iconProps} className={`${iconProps.className} text-cyan-400`} />;
    case "CloudRain":
      return <CloudRain {...iconProps} className={`${iconProps.className} text-blue-400`} />;
    case "CloudSnow":
      return <CloudSnow {...iconProps} className={`${iconProps.className} text-sky-200`} />;
    case "CloudLightning":
      return <CloudLightning {...iconProps} className={`${iconProps.className} text-yellow-400`} />;
    case "Snowflake":
      return <Snowflake {...iconProps} className={`${iconProps.className} text-sky-300`} />;
    case "Wind":
      return <Wind {...iconProps} className={`${iconProps.className} text-teal-300`} />;
    default:
      return <Cloud {...iconProps} className={`${iconProps.className} text-slate-300`} />;
  }
};
