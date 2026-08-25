import { isFashionMode } from "@/lib/app-mode";
import { getSiteUrl } from "@/lib/site";

/** Organization / WebSite JSON-LD so Google can associate the brand logo. */
export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const fashion = isFashionMode();

  const data = fashion
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Smart craft corner",
        url: siteUrl,
        logo: `${siteUrl}/apple-icon`,
      }
    : {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            name: "BloodLink BD",
            alternateName: "BloodLink",
            url: siteUrl,
            logo: {
              "@type": "ImageObject",
              url: `${siteUrl}/icon-192.png`,
              width: 192,
              height: 192,
            },
            image: `${siteUrl}/bloodlink-logo.png`,
          },
          {
            "@type": "WebSite",
            name: "BloodLink BD",
            url: siteUrl,
            inLanguage: "bn-BD",
          },
        ],
      };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
