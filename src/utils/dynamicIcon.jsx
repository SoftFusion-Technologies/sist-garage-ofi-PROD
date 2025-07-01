// utils/dynamicIcon.js
import * as FaIcons from 'react-icons/fa';

export function dynamicIcon(nombre) {
  if (!nombre) return null;
  const Icon = FaIcons[nombre];
  return Icon ? <Icon /> : null;
}
