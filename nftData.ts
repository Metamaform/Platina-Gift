import collections from '../collections.json';

export const gradients = [
  "from-blue-500/80 to-purple-600/80",
  "from-emerald-500/80 to-teal-600/80",
  "from-orange-500/80 to-rose-600/80",
  "from-pink-500/80 to-violet-600/80",
  "from-cyan-500/80 to-blue-600/80",
  "from-amber-500/80 to-orange-600/80",
  "from-fuchsia-500/80 to-pink-600/80"
];

export const patterns = [
  "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
  "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 17L3 7h14L10 17z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E\")",
  "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 0h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 2v16h16V2H2z' fill='%23ffffff' fill-opacity='0.08' fill-rule='evenodd'/%3E%3C/svg%3E\")",
  "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0l10 10-10 10L0 10z' fill='%23ffffff' fill-opacity='0.07' fill-rule='evenodd'/%3E%3C/svg%3E\")"
];

export const getRandomNftStyling = () => {
  return {
    gradient: gradients[Math.floor(Math.random() * gradients.length)],
    pattern: patterns[Math.floor(Math.random() * patterns.length)]
  };
};

export const nftDataMapping: Record<string, any> = {};

collections.forEach((c: any, i: number) => {
  const id = String(i + 1).padStart(3, '0');
  nftDataMapping[id] = {
    name: c.name,
    price: Math.floor(Math.random() * 100) + 10,
    address: c.address
  };
});
