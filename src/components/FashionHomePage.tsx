import Link from "next/link";

const categoryCards = [
  {
    title: "লাক্সারি জামদানি",
    subtitle: "ঐতিহ্য ও আধুনিক কাটের ফিউশন",
    accent: "from-[#f5e8dc] via-[#fffaf6] to-[#ead5c3]",
  },
  {
    title: "মডেস্ট ফেস্টিভ এডিট",
    subtitle: "ঈদ, দাওয়াত, হলুদ, রিসেপশন",
    accent: "from-[#e6d7cf] via-[#f8efea] to-[#d9c0b3]",
  },
  {
    title: "ডেইলি এলিগেন্স",
    subtitle: "অফিস, ইউনিভার্সিটি, ক্যাফে ডে",
    accent: "from-[#efe4dd] via-[#fffaf7] to-[#e3d0c5]",
  },
];

const featuredProducts = [
  {
    name: "Noor Signature Silk Set",
    price: "৳ 8,450",
    details: "Soft silk kameez, tailored trousers, hand-finished organza dupatta.",
    label: "Best Seller",
    tone: "bg-[#f8efe9]",
  },
  {
    name: "Dhaka Pearl Abaya",
    price: "৳ 6,280",
    details: "Flowing silhouette with pearl cuff detailing and premium nida fabric.",
    label: "New Arrival",
    tone: "bg-[#f5ece6]",
  },
  {
    name: "Rose Gold Saree Capsule",
    price: "৳ 11,900",
    details: "Festive saree with luminous finish, blouse piece, and gift-ready packaging.",
    label: "Limited Edit",
    tone: "bg-[#f2e3dc]",
  },
  {
    name: "Minimal Luxe Co-ord",
    price: "৳ 5,790",
    details: "Easy premium daywear with clean lines and breathable textured cotton.",
    label: "Easy Luxury",
    tone: "bg-[#efe7e1]",
  },
];

const serviceHighlights = [
  "ঢাকা সিটিতে দ্রুত ডেলিভারি এবং সারা বাংলাদেশে কুরিয়ার সাপোর্ট",
  "Cash on Delivery, bKash, Nagad এবং কার্ড পেমেন্ট",
  "সাইজ গাইড, স্টাইলিং হেল্প, এবং WhatsApp কনসাল্টেশন",
  "গিফট বক্স, ফেস্টিভ প্যাকেজিং, এবং curated bundle offers",
];

const testimonials = [
  {
    quote:
      "ডিজাইনগুলো খুব ক্লিন, ফ্যাব্রিক প্রিমিয়াম, আর delivery experience সত্যিই polished লেগেছে।",
    author: "Nusrat, Dhanmondi",
  },
  {
    quote:
      "অনলাইনে luxury feel পাওয়া কঠিন, কিন্তু এই স্টোরের product curation আর presentation খুব confidence দেয়।",
    author: "Fariha, Chattogram",
  },
  {
    quote:
      "Festive shopping-এর জন্য one-stop solution মনে হয়েছে। Size support আর packaging দুটোই excellent.",
    author: "Mahi, Sylhet",
  },
];

const faqs = [
  {
    q: "সাইজ ঠিকমতো বুঝবো কীভাবে?",
    a: "প্রতিটি প্রোডাক্টের সাথে detailed size chart, fabric note, এবং fitting suggestion দেওয়া আছে। চাইলে WhatsApp styling support-ও পাওয়া যাবে।",
  },
  {
    q: "রিটার্ন বা এক্সচেঞ্জ আছে?",
    a: "ডেলিভারির ৩ দিনের মধ্যে size exchange support থাকবে, আর damaged item হলে priority replacement করা হবে।",
  },
  {
    q: "বিয়ের/ফেস্টিভ collections কি custom order করা যাবে?",
    a: "হ্যাঁ, selected festive pieces-এর জন্য custom measurement consultation এবং preorder slot রাখা হয়েছে।",
  },
];

export function FashionHomePage() {
  return (
    <main className="min-h-screen bg-[#fffaf7] text-[#241815]">
      <section className="relative overflow-hidden border-b border-black/5 bg-[radial-gradient(circle_at_top_left,#fff6ef,transparent_35%),linear-gradient(135deg,#2c1d1a_0%,#4f342f_48%,#b88b74_100%)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_38%,rgba(255,255,255,0.12)_100%)]" />
        <div className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-[#f4d4c2]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#f8e5d6]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-6 md:px-8 md:pb-24 md:pt-8">
          <header className="flex flex-col gap-5 rounded-full border border-white/15 bg-white/8 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-7">
            <div>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[0.2em] uppercase">
                Nooré Dhaka
              </p>
              <p className="mt-1 text-sm text-white/75">
                Luxury womenswear for Bangladesh
              </p>
            </div>
            <nav className="flex flex-wrap gap-3 text-sm text-white/80">
              <a href="#collections" className="rounded-full px-3 py-1.5 transition hover:bg-white/10">
                Collections
              </a>
              <a href="#featured" className="rounded-full px-3 py-1.5 transition hover:bg-white/10">
                Featured
              </a>
              <a href="#service" className="rounded-full px-3 py-1.5 transition hover:bg-white/10">
                Service
              </a>
              <a href="#faq" className="rounded-full px-3 py-1.5 transition hover:bg-white/10">
                FAQ
              </a>
            </nav>
          </header>

          <div className="grid gap-12 pt-14 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pt-20">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur">
                বাংলাদেশি নারীদের জন্য curated premium fashion destination
              </span>
              <h1 className="mt-6 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-tight font-bold md:text-7xl">
                সহজ luxury,
                <br />
                refined style,
                <br />
                modern Bangladesh.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 md:text-lg">
                Nooré Dhaka এমন একটি e-commerce experience যেখানে premium fabric, soft
                color palette, festive elegance, আর daily sophistication—সবকিছু একসাথে
                পাওয়া যায়। ঢাকা থেকে সারা বাংলাদেশে delivery, effortless browsing, আর
                women-first styling support দিয়ে তৈরি।
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#featured"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2d1f1b] transition hover:-translate-y-0.5"
                >
                  Shop Featured Edit
                </Link>
                <Link
                  href="#collections"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16"
                >
                  Browse Collections
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ["150+", "Curated luxury pieces"],
                  ["64 জেলা", "Nationwide delivery reach"],
                  ["4.9/5", "Client satisfaction rating"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-3xl border border-white/12 bg-white/10 px-5 py-5 backdrop-blur">
                    <p className="font-[family-name:var(--font-display)] text-3xl font-bold">
                      {value}
                    </p>
                    <p className="mt-2 text-sm text-white/72">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:pl-10">
              <div className="rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06))] p-5 shadow-2xl backdrop-blur">
                <div className="rounded-[1.75rem] bg-[#f6ece6] p-5 text-[#281a17]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#8b6354]">
                        Editor&apos;s Pick
                      </p>
                      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">
                        Pearl Evening Edit
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-[#654a3f]">
                        Satin shimmer, structured drape, and delicate embellished
                        finishing for intimate wedding nights and polished dinner looks.
                      </p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8d6657]">
                      ৳ 9,990+
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {["Rose Pearl", "Mocha Nude", "Soft Gold"].map((shade) => (
                      <div
                        key={shade}
                        className="rounded-2xl border border-black/5 bg-white px-3 py-4 text-center shadow-sm"
                      >
                        <div className="mx-auto h-10 w-10 rounded-full bg-[linear-gradient(135deg,#f8dfd5,#dcb7a4)]" />
                        <p className="mt-3 text-xs font-medium text-[#76584b]">{shade}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm text-white/68">Premium fabrics</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
                    Silk, organza, nida, textured cotton
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/12 bg-[#f1ddd1] p-5 text-[#2a1d19] shadow-xl">
                  <p className="text-sm text-[#7b5a4d]">Style support</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
                    WhatsApp consultation & gift curation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="collections"
        className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#9b7766]">
              Collections
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
              Curated edits for every elegant moment
            </h2>
          </div>
          <p className="max-w-xl text-base leading-8 text-[#6e5449]">
            Casual থেকে festive, modest থেকে statement—সব collection একই luxury
            ভাষায় সাজানো, যাতে browsing experience clean থাকে এবং product decision
            সহজ হয়।
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {categoryCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-[2rem] border border-black/6 bg-gradient-to-br ${card.accent} p-7 shadow-[0_24px_80px_rgba(48,27,20,0.06)]`}
            >
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <span className="inline-flex rounded-full border border-black/8 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8d6557]">
                    curated
                  </span>
                  <h3 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-bold">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-[#694f45]">{card.subtitle}</p>
                </div>
                <div className="flex items-center justify-between text-sm font-medium text-[#5b4339]">
                  <span>Explore edit</span>
                  <span aria-hidden="true">↗</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="featured" className="border-y border-black/5 bg-[#f8f0eb]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#9b7766]">
                Featured products
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
                Premium pieces customers will notice first
              </h2>
            </div>
            <div className="rounded-full border border-black/8 bg-white px-5 py-3 text-sm text-[#6f554a] shadow-sm">
              Free shipping over ৳ 7,000 inside Dhaka
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <article
                key={product.name}
                className="group overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_80px_rgba(48,27,20,0.06)] transition hover:-translate-y-1"
              >
                <div className={`relative h-64 ${product.tone} p-5`}>
                  <div className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8d6657] shadow-sm">
                    {product.label}
                  </div>
                  <div className="flex h-full items-end">
                    <div className="w-full rounded-[1.5rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,232,225,0.78))] px-5 py-6 shadow-lg">
                      <div className="flex gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#d8b3a0]" />
                        <span className="h-3 w-3 rounded-full bg-[#f2dcca]" />
                        <span className="h-3 w-3 rounded-full bg-[#7f5d51]" />
                      </div>
                      <p className="mt-4 text-sm text-[#7a5c50]">Limited seasonal capsule</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                      {product.name}
                    </h3>
                    <p className="text-base font-semibold text-[#8f624e]">{product.price}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#6c5247]">{product.details}</p>
                  <button className="mt-6 inline-flex items-center rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-[#2b1d19] transition group-hover:bg-[#2b1d19] group-hover:text-white">
                    Add to cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="service" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-[#2f211d] p-8 text-white shadow-[0_30px_90px_rgba(48,27,20,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/55">
              Why shoppers stay
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold">
              Luxury doesn&apos;t have to feel complicated
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-white/76">
              এই স্টোরের UI, product selection, payment options, এবং post-purchase
              communication—সবকিছু এমনভাবে সাজানো যাতে high-end shopping feel থাকে,
              কিন্তু ব্যবহার করা একদম সহজ হয়।
            </p>
            <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/8 p-5">
              <p className="text-sm text-white/65">Shopping journey</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {["Discover", "Shortlist", "Style help", "Secure payment", "Fast delivery"].map(
                  (step, index) => (
                    <span
                      key={step}
                      className="rounded-full border border-white/12 bg-white/8 px-4 py-2"
                    >
                      {index + 1}. {step}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {serviceHighlights.map((item) => (
              <div
                key={item}
                className="rounded-[1.75rem] border border-black/6 bg-[#fcf6f2] p-6 shadow-[0_18px_60px_rgba(48,27,20,0.05)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0ddd2] text-lg text-[#8b6456]">
                  ✦
                </div>
                <p className="mt-5 text-base leading-8 text-[#60483f]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#9b7766]">
                Client voice
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
                Trusted by women who love quiet statement pieces
              </h2>
            </div>
            <p className="max-w-xl text-base leading-8 text-[#6e5449]">
              Real shoppers expect quality, clarity, and consistency. তাই review section-এ
              presentation-টাও clean এবং confidence-building রাখা হয়েছে।
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <blockquote
                key={item.author}
                className="rounded-[2rem] border border-black/6 bg-[#fdf8f4] p-7 shadow-[0_20px_70px_rgba(48,27,20,0.05)]"
              >
                <p className="text-lg leading-8 text-[#513b33]">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#9b7766]">
                  {item.author}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#9b7766]">
              FAQ
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
              Simple support for premium shopping
            </h2>
            <p className="mt-4 max-w-lg text-base leading-8 text-[#6e5449]">
              Bangladesh-focused online fashion store হিসেবে trust building খুব জরুরি।
              তাই key questions আগেই সামনে আনা হয়েছে।
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((item) => (
              <article
                key={item.q}
                className="rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_18px_60px_rgba(48,27,20,0.04)]"
              >
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                  {item.q}
                </h3>
                <p className="mt-3 text-base leading-8 text-[#634b42]">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 md:px-8 md:pb-24">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-[linear-gradient(135deg,#2b1d19_0%,#51362f_45%,#bb8f78_100%)] px-7 py-10 text-white shadow-[0_30px_90px_rgba(48,27,20,0.16)] md:px-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/55">
                Final call to action
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
                Build your signature wardrobe with fewer, better pieces
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/78">
                Elegant essentials, festive showstoppers, and soft luxury staples—সবকিছু
                curated করা হয়েছে যাতে আপনার shopping decision দ্রুত হয়, কিন্তু feel থাকে
                premium।
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/12 bg-white/10 p-6 backdrop-blur">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-white px-5 py-5 text-[#2c1e1b]">
                  <p className="text-sm text-[#8b6456]">WhatsApp order desk</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
                    +880 1XXX-XXXXXX
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/12 bg-white/10 px-5 py-5">
                  <p className="text-sm text-white/64">Launch offer</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
                    10% off first order
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#collections"
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#2b1d19]"
                >
                  Start Shopping
                </Link>
                <Link
                  href="#faq"
                  className="inline-flex items-center justify-center rounded-full border border-white/16 px-5 py-3 text-sm font-semibold text-white"
                >
                  Review Policies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
