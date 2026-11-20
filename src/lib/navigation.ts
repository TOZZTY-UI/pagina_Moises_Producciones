import navigationData from '../data/navigation.json';

export interface NavigationLink {
  slug: string;
  label: string;
  href: string;
  sectionId?: string;
}

export const navigation: NavigationLink[] = navigationData;
