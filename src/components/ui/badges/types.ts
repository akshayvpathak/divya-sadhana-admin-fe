import { BadgeProps } from '../badge';

export interface StatusConfig {
  label: string;
  variant: BadgeProps['variant'];
  className?: string;
}
