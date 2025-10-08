#!/usr/bin/env node
/* eslint-env node */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Base testimonials structure (from working English version)
const testimonialsStructure = {
  "trust": {
    "title": "Why Teams Trust ODAVL",
    "certification": {
      "title": "SOC 2 Compliant",
      "description": "Enterprise security standards with full audit trails."
    },
    "enterprise": {
      "title": "Enterprise-Grade Security",
      "description": "Governed automation with auditable controls."
    },
    "community": {
      "title": "Open Source Foundation", 
      "description": "Built on trusted open-source tools."
    },
    "growth": {
      "title": "500+ Engineering Teams",
      "description": "Adopted through pilots with proven results."
    }
  },
  "caseStudies": {
    "title": "Success Stories",
    "subtitle": "Real-world outcomes from our pilot program."
  },
  "case1": {
    "company": "TechFlow Solutions",
    "industry": "Financial Technology",
    "challenge": "Manual code reviews creating bottlenecks in their deployment pipeline.",
    "solution": "Implemented ODAVL's autonomous quality system for their core banking platform.",
    "results": {
      "quality": {
        "title": "Code Quality Score",
        "value": "+40%",
        "improvement": "Reduced technical debt through automated refactoring"
      },
      "time": {
        "title": "Review Time", 
        "value": "-60%",
        "improvement": "Faster deployment cycles with maintained quality standards"
      }
    }
  },
  "case2": {
    "company": "CloudScale Systems",
    "industry": "Enterprise Infrastructure",
    "challenge": "Inconsistent code quality across 50+ microservices and multiple development teams.",
    "solution": "Deployed ODAVL for centralized quality governance across their cloud infrastructure.",
    "results": {
      "consistency": {
        "title": "Code Consistency",
        "value": "+85%",
        "improvement": "Standardized patterns across all services"
      },
      "bugs": {
        "title": "Bug Rate",
        "value": "-45%", 
        "improvement": "Proactive issue detection and resolution"
      }
    }
  }
};

// Translations for each locale
const translations = {
  de: {
    "trust": {
      "title": "Warum Teams ODAVL vertrauen",
      "certification": {
        "title": "SOC 2 Konform",
        "description": "Unternehmens-Sicherheitsstandards mit vollständigen Prüfpfaden."
      },
      "enterprise": {
        "title": "Unternehmens-Sicherheit",
        "description": "Geregelte Automatisierung mit prüfbaren Kontrollen."
      },
      "community": {
        "title": "Open Source Fundament",
        "description": "Basiert auf vertrauenswürdigen Open-Source-Tools."
      },
      "growth": {
        "title": "500+ Engineering Teams",
        "description": "Durch Pilotprojekte mit bewiesenen Ergebnissen eingeführt."
      }
    },
    "caseStudies": {
      "title": "Erfolgsgeschichten", 
      "subtitle": "Echte Ergebnisse aus unserem Pilotprogramm."
    },
    "case1": {
      "company": "TechFlow Solutions",
      "industry": "Finanztechnologie",
      "challenge": "Manuelle Code-Reviews erstellen Engpässe in der Deployment-Pipeline.",
      "solution": "Implementierung von ODAVLs autonomem Qualitätssystem für ihre Kernbankplattform.",
      "results": {
        "quality": {
          "title": "Code-Qualitätswert",
          "value": "+40%",
          "improvement": "Reduzierte technische Schulden durch automatisierte Refaktorierung"
        },
        "time": {
          "title": "Review-Zeit",
          "value": "-60%",
          "improvement": "Schnellere Deployment-Zyklen bei gleichbleibenden Qualitätsstandards"
        }
      }
    },
    "case2": {
      "company": "CloudScale Systems",
      "industry": "Unternehmens-Infrastruktur",
      "challenge": "Inkonsistente Code-Qualität über 50+ Microservices und mehrere Entwicklungsteams.",
      "solution": "Einsatz von ODAVL für zentrale Qualitätssteuerung in ihrer Cloud-Infrastruktur.",
      "results": {
        "consistency": {
          "title": "Code-Konsistenz",
          "value": "+85%",
          "improvement": "Standardisierte Muster über alle Services"
        },
        "bugs": {
          "title": "Bug-Rate",
          "value": "-45%",
          "improvement": "Proaktive Fehlererkennung und -behebung"
        }
      }
    }
  },
  // Other locales will use English as fallback for now - professional translation later
  ar: testimonialsStructure,
  fr: testimonialsStructure,
  es: testimonialsStructure,  
  it: testimonialsStructure,
  pt: testimonialsStructure,
  ru: testimonialsStructure,
  ja: testimonialsStructure,
  zh: testimonialsStructure
};

const locales = ['de', 'ar', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh'];

async function fixTestimonials() {
  const messagesDir = path.join(__dirname, '..', 'messages');
  
  console.log('🎯 ODAVL Testimonials Fix - Batch Processing\n');
  
  for (const locale of locales) {
    const filePath = path.join(messagesDir, `${locale}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${locale}.json not found, skipping...`);
      continue;
    }
    
    try {
      // Read current file
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Update testimonials section
      data.testimonials = translations[locale] || testimonialsStructure;
      
      // Write back with proper formatting
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      
      console.log(`✅ Fixed ${locale}.json - testimonials structure updated`);
    } catch (error) {
      console.log(`❌ Error processing ${locale}.json:`, error.message);
    }
  }
  
  console.log('\n🚀 Batch processing complete!');
  console.log('Run: npm run build to validate all locales');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixTestimonials();
}

export { fixTestimonials };