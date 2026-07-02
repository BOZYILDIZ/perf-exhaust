/**
 * Catalogue véhicules pour la sélection progressive du formulaire de devis.
 *
 * Base locale TypeScript, sans API externe ni base de données — facile à
 * enrichir : ajouter une marque, un modèle, des années ou des motorisations
 * ici suffit, le sélecteur (VehicleSelector) s'adapte automatiquement.
 *
 * Le sélecteur ajoute lui-même les options « Autre » (marque, modèle,
 * motorisation) : inutile de les déclarer ici, sauf pour les motorisations
 * où « Autre » ferme chaque liste par convention.
 */

export interface VehicleModel {
  name: string
  years: string[]
  engines: string[]
}

export interface VehicleBrand {
  brand: string
  models: VehicleModel[]
}

function yearRange(from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => String(to - i))
}

export const vehicleCatalog: VehicleBrand[] = [
  {
    brand: 'Audi',
    models: [
      { name: 'A1', years: yearRange(2010, 2024), engines: ['25 TFSI', '30 TFSI', '35 TFSI', '40 TFSI', 'Autre'] },
      { name: 'A3', years: yearRange(2012, 2024), engines: ['30 TDI', '35 TDI', '30 TFSI', '35 TFSI', '40 TFSI', 'Autre'] },
      { name: 'S3', years: yearRange(2013, 2024), engines: ['2.0 TFSI 300ch', '2.0 TFSI 310ch', '2.0 TFSI 333ch', 'Autre'] },
      { name: 'RS3', years: yearRange(2015, 2024), engines: ['2.5 TFSI 367ch', '2.5 TFSI 400ch', 'Autre'] },
      { name: 'A4', years: yearRange(2008, 2024), engines: ['2.0 TDI', '35 TFSI', '40 TFSI', '45 TFSI', 'Autre'] },
      { name: 'S4 / RS4', years: yearRange(2012, 2024), engines: ['S4 3.0 TFSI', 'S4 3.0 TDI', 'RS4 2.9 TFSI', 'Autre'] },
      { name: 'A5', years: yearRange(2008, 2024), engines: ['2.0 TDI', '40 TFSI', '45 TFSI', 'S5 3.0 TFSI', 'Autre'] },
      { name: 'RS6', years: yearRange(2013, 2024), engines: ['4.0 TFSI 560ch', '4.0 TFSI 600ch', '4.0 TFSI 630ch', 'Autre'] },
      { name: 'TT / TTS / TTRS', years: yearRange(2008, 2023), engines: ['2.0 TFSI', 'TTS 2.0 TFSI', 'TTRS 2.5 TFSI', 'Autre'] },
      { name: 'Q3 / RSQ3', years: yearRange(2012, 2024), engines: ['35 TDI', '35 TFSI', '40 TFSI', 'RSQ3 2.5 TFSI', 'Autre'] },
    ],
  },
  {
    brand: 'BMW',
    models: [
      { name: 'Série 1', years: yearRange(2008, 2024), engines: ['116i', '118i', '118d', '120d', '120i', 'M135i', 'M140i', 'Autre'] },
      { name: 'Série 2', years: yearRange(2014, 2024), engines: ['218i', '220i', '220d', 'M235i', 'M240i', 'Autre'] },
      { name: 'M2', years: yearRange(2016, 2024), engines: ['M2 370ch', 'M2 Competition 410ch', 'M2 G87 460ch', 'Autre'] },
      { name: 'Série 3', years: yearRange(2008, 2024), engines: ['318d', '320d', '320i', '330d', '330i', '335i', '340i', 'M340i', 'Autre'] },
      { name: 'M3 / M4', years: yearRange(2014, 2024), engines: ['M3 431ch', 'M3 Competition 510ch', 'M4 431ch', 'M4 Competition 510ch', 'Autre'] },
      { name: 'Série 4', years: yearRange(2014, 2024), engines: ['420d', '420i', '430i', '435i', '440i', 'M440i', 'Autre'] },
      { name: 'Série 5', years: yearRange(2010, 2024), engines: ['520d', '525d', '530d', '530i', '540i', 'M550i', 'Autre'] },
      { name: 'X3 / X4', years: yearRange(2011, 2024), engines: ['xDrive20d', 'xDrive30d', 'M40i', 'X3 M / X4 M', 'Autre'] },
    ],
  },
  {
    brand: 'Cupra',
    models: [
      { name: 'Leon', years: yearRange(2020, 2024), engines: ['1.5 TSI 150ch', '2.0 TSI 245ch', '2.0 TSI 300ch', 'Autre'] },
      { name: 'Formentor', years: yearRange(2020, 2024), engines: ['1.5 TSI 150ch', '2.0 TSI 245ch', '2.0 TSI 310ch', 'VZ5 2.5 TSI 390ch', 'Autre'] },
      { name: 'Ateca', years: yearRange(2018, 2024), engines: ['2.0 TSI 300ch', 'Autre'] },
    ],
  },
  {
    brand: 'Ford',
    models: [
      { name: 'Fiesta ST', years: yearRange(2013, 2023), engines: ['1.6 EcoBoost 182ch', '1.5 EcoBoost 200ch', 'Autre'] },
      { name: 'Focus ST', years: yearRange(2012, 2024), engines: ['2.0 EcoBoost 250ch', '2.3 EcoBoost 280ch', '2.0 TDCi 185ch', 'Autre'] },
      { name: 'Focus RS', years: yearRange(2009, 2018), engines: ['2.5T 305ch', '2.3 EcoBoost 350ch', 'Autre'] },
      { name: 'Mustang', years: yearRange(2015, 2024), engines: ['2.3 EcoBoost', 'GT V8 5.0', 'Mach 1 V8 5.0', 'Autre'] },
      { name: 'Puma ST', years: yearRange(2020, 2024), engines: ['1.5 EcoBoost 200ch', 'Autre'] },
    ],
  },
  {
    brand: 'Mercedes-Benz',
    models: [
      { name: 'Classe A', years: yearRange(2012, 2024), engines: ['A180', 'A200', 'A220', 'A250', 'A180d', 'A200d', 'Autre'] },
      { name: 'AMG A35 / A45', years: yearRange(2013, 2024), engines: ['A35 306ch', 'A45 381ch', 'A45 S 421ch', 'Autre'] },
      { name: 'CLA', years: yearRange(2013, 2024), engines: ['CLA 200', 'CLA 250', 'CLA 35 AMG', 'CLA 45 AMG', 'Autre'] },
      { name: 'Classe C', years: yearRange(2010, 2024), engines: ['C200', 'C220d', 'C300', 'C43 AMG', 'C63 AMG', 'Autre'] },
      { name: 'Classe E', years: yearRange(2010, 2024), engines: ['E220d', 'E300', 'E350', 'E53 AMG', 'E63 AMG', 'Autre'] },
      { name: 'GLA / GLB', years: yearRange(2014, 2024), engines: ['GLA 200', 'GLA 250', 'GLA 35 AMG', 'GLA 45 AMG', 'Autre'] },
    ],
  },
  {
    brand: 'Mini',
    models: [
      { name: 'Cooper', years: yearRange(2007, 2024), engines: ['One', 'Cooper 136ch', 'Cooper D', 'Autre'] },
      { name: 'Cooper S', years: yearRange(2007, 2024), engines: ['1.6T 175ch', '2.0T 192ch', '2.0T 178ch', 'Autre'] },
      { name: 'John Cooper Works', years: yearRange(2008, 2024), engines: ['1.6T 211ch', '2.0T 231ch', '2.0T 306ch', 'Autre'] },
      { name: 'Countryman', years: yearRange(2010, 2024), engines: ['Cooper', 'Cooper S', 'JCW', 'Autre'] },
    ],
  },
  {
    brand: 'Nissan',
    models: [
      { name: '350Z', years: yearRange(2003, 2009), engines: ['V6 3.5 280ch', 'V6 3.5 300ch', 'Autre'] },
      { name: '370Z', years: yearRange(2009, 2020), engines: ['V6 3.7 328ch', 'Nismo 344ch', 'Autre'] },
      { name: 'GT-R', years: yearRange(2008, 2022), engines: ['3.8 V6 485ch', '3.8 V6 550ch', '3.8 V6 570ch', 'Autre'] },
      { name: 'Qashqai', years: yearRange(2007, 2024), engines: ['1.3 DIG-T', '1.5 dCi', '1.6 dCi', 'Autre'] },
    ],
  },
  {
    brand: 'Peugeot',
    models: [
      { name: '208', years: yearRange(2012, 2024), engines: ['1.2 PureTech', '1.5 BlueHDi', 'GTI 1.6 THP 200ch', 'GTI 1.6 THP 208ch', 'Autre'] },
      { name: '308', years: yearRange(2008, 2024), engines: ['1.2 PureTech', '1.5 BlueHDi', '1.6 THP', 'GTI 1.6 THP 270ch', 'Autre'] },
      { name: '508', years: yearRange(2011, 2024), engines: ['1.5 BlueHDi', '1.6 PureTech 180ch', '1.6 PureTech 225ch', 'PSE 360ch', 'Autre'] },
      { name: 'RCZ', years: yearRange(2010, 2015), engines: ['1.6 THP 156ch', '1.6 THP 200ch', 'R 1.6 THP 270ch', 'Autre'] },
      { name: '3008', years: yearRange(2009, 2024), engines: ['1.2 PureTech', '1.5 BlueHDi', '1.6 PureTech', '2.0 BlueHDi', 'Autre'] },
    ],
  },
  {
    brand: 'Porsche',
    models: [
      { name: '718 Cayman / Boxster', years: yearRange(2016, 2024), engines: ['2.0T 300ch', 'S 2.5T 350ch', 'GTS 4.0 400ch', 'GT4 4.0 420ch', 'Autre'] },
      { name: 'Cayman / Boxster (981)', years: yearRange(2012, 2016), engines: ['2.7 275ch', 'S 3.4 325ch', 'GTS 3.4 340ch', 'Autre'] },
      { name: '911 (991/992)', years: yearRange(2012, 2024), engines: ['Carrera', 'Carrera S', 'GTS', 'Turbo', 'GT3', 'Autre'] },
      { name: 'Macan', years: yearRange(2014, 2024), engines: ['2.0T 245ch', 'S 3.0T 354ch', 'GTS 2.9T 440ch', 'Turbo 2.9T 440ch', 'Autre'] },
      { name: 'Panamera', years: yearRange(2010, 2024), engines: ['2.9T', '4.0T V8', 'Diesel 3.0/4.0', 'Autre'] },
    ],
  },
  {
    brand: 'Renault',
    models: [
      { name: 'Clio RS', years: yearRange(2006, 2019), engines: ['2.0 197ch', '2.0 203ch', '1.6T 200ch', '1.6T 220ch Trophy', 'Autre'] },
      { name: 'Mégane RS', years: yearRange(2009, 2023), engines: ['2.0T 250ch', '2.0T 265ch', '2.0T 275ch', '1.8T 280ch', '1.8T 300ch Trophy', 'Autre'] },
      { name: 'Mégane', years: yearRange(2008, 2024), engines: ['1.2 TCe', '1.3 TCe', '1.5 dCi', 'GT 1.6 TCe 205ch', 'Autre'] },
      { name: 'Twingo RS', years: yearRange(2008, 2013), engines: ['1.6 133ch', 'Autre'] },
    ],
  },
  {
    brand: 'Seat',
    models: [
      { name: 'Ibiza', years: yearRange(2008, 2024), engines: ['1.0 TSI', '1.5 TSI', 'Cupra 1.8 TSI 192ch', 'Autre'] },
      { name: 'Leon', years: yearRange(2008, 2024), engines: ['1.5 TSI', '2.0 TDI', 'FR 2.0 TSI', 'Autre'] },
      { name: 'Leon Cupra', years: yearRange(2010, 2020), engines: ['2.0 TSI 265ch', '2.0 TSI 280ch', '2.0 TSI 290ch', '2.0 TSI 300ch', 'Autre'] },
      { name: 'Ateca', years: yearRange(2016, 2024), engines: ['1.5 TSI', '2.0 TDI', 'Cupra 2.0 TSI 300ch', 'Autre'] },
    ],
  },
  {
    brand: 'Toyota',
    models: [
      { name: 'GR Supra', years: yearRange(2019, 2024), engines: ['2.0T 258ch', '3.0T B58 340ch', '3.0T B58 387ch', 'Autre'] },
      { name: 'GR Yaris', years: yearRange(2020, 2024), engines: ['1.6T 261ch', '1.6T 280ch', 'Autre'] },
      { name: 'GT86 / GR86', years: yearRange(2012, 2024), engines: ['2.0 200ch', '2.4 234ch', 'Autre'] },
      { name: 'Yaris', years: yearRange(2010, 2024), engines: ['1.0 VVT-i', '1.5 Hybrid', 'Autre'] },
    ],
  },
  {
    brand: 'Volkswagen',
    models: [
      { name: 'Polo', years: yearRange(2009, 2024), engines: ['1.0 TSI', '1.6 TDI', 'GTI 1.8 TSI 192ch', 'GTI 2.0 TSI 200ch', 'GTI 2.0 TSI 207ch', 'Autre'] },
      { name: 'Golf 6', years: yearRange(2008, 2013), engines: ['1.4 TSI', '2.0 TDI', 'GTI 2.0 TSI 210ch', 'R 2.0 TSI 270ch', 'Autre'] },
      { name: 'Golf 7', years: yearRange(2012, 2020), engines: ['1.4 TSI', '2.0 TDI 150ch', 'GTI 2.0 TSI 220ch', 'GTI Performance 245ch', 'R 2.0 TSI 300ch', 'Autre'] },
      { name: 'Golf 8', years: yearRange(2020, 2024), engines: ['1.5 TSI', '2.0 TDI', 'GTI 2.0 TSI 245ch', 'R 2.0 TSI 320ch', 'Autre'] },
      { name: 'Scirocco', years: yearRange(2008, 2017), engines: ['1.4 TSI', '2.0 TSI 200ch', 'R 2.0 TSI 280ch', 'Autre'] },
      { name: 'Tiguan', years: yearRange(2008, 2024), engines: ['1.5 TSI', '2.0 TDI', '2.0 TSI', 'R 2.0 TSI 320ch', 'Autre'] },
      { name: 'T-Roc', years: yearRange(2017, 2024), engines: ['1.0 TSI', '1.5 TSI', '2.0 TDI', 'R 2.0 TSI 300ch', 'Autre'] },
    ],
  },
]
