"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/store/i18nStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import { WHEEL_RECIPIENTS, WHEEL_GIFTS, type WheelGift } from "@/lib/data";
import GradientText from "./GradientText";
import ImagePlaceholder from "./ImagePlaceholder";

const ITEM_HEIGHT = 64; // px
const SPIN_DURATION = 4.5; // seconds

export default function GiftWheelModal({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const addWishlistItem = useWishlistStore(s => s.addItem);
  
  const [step, setStep] = useState<"idle" | "spinningRecipients" | "spinningGifts" | "done">("idle");
  const [recipientList, setRecipientList] = useState<string[]>([]);
  const [giftList, setGiftList] = useState<WheelGift[]>([]);
  
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    generateLists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const generateLists = () => {
    const recs = WHEEL_RECIPIENTS[lang] || WHEEL_RECIPIENTS["tr"];
    const gifts = WHEEL_GIFTS[lang] || WHEEL_GIFTS["tr"];
    
    // Create 50 random items without consecutive duplicates
    const rList: string[] = [];
    for (let i = 0; i < 50; i++) {
      let r = recs[Math.floor(Math.random() * recs.length)];
      while (i > 0 && r === rList[i - 1]) {
        r = recs[Math.floor(Math.random() * recs.length)];
      }
      rList.push(r);
    }
    setRecipientList(rList);
    
    const gList: WheelGift[] = [];
    for (let i = 0; i < 50; i++) {
      let g = gifts[Math.floor(Math.random() * gifts.length)];
      while (i > 0 && g.id === gList[i - 1].id) {
        g = gifts[Math.floor(Math.random() * gifts.length)];
      }
      gList.push(g);
    }
    setGiftList(gList);
  };

  const handleSpin = () => {
    if (step === "done" || step !== "idle") {
      setStep("idle");
      generateLists();
      setTimeout(() => {
        setStep("spinningRecipients");
        setTimeout(() => {
          setStep("spinningGifts");
          setTimeout(() => {
            setStep("done");
          }, SPIN_DURATION * 1000);
        }, SPIN_DURATION * 1000 - 500);
      }, 50);
      return;
    }

    setStep("spinningRecipients");
    setTimeout(() => {
      setStep("spinningGifts");
      setTimeout(() => {
        setStep("done");
      }, SPIN_DURATION * 1000);
    }, SPIN_DURATION * 1000 - 500);
  };

  const handleSave = async () => {
    if (!user) {
      showToast(lang === "tr" ? "Lütfen giriş yapın" : "Please sign in");
      return;
    }
    const finalGift = giftList[45]; // We stop at index 45 for the longer spin
    if (!finalGift) return;
    
    const added = await addWishlistItem(user.id, {
      product_name: finalGift.name,
      product_link: finalGift.link,
      product_image: finalGift.image,
      product_description: lang === "tr" ? "Hediye Çarkı'ndan rastgele seçildi." : "Randomly picked from the Gift Wheel.",
      reasoning: lang === "tr" ? "Çarkın şansı" : "Wheel of fortune",
      current_price: finalGift.price,
      source_store: finalGift.store,
      source_icon: "",
      rating: null,
      thumbnails: [],
      tone: finalGift.tone,
      note: ""
    });
    
    if (added) {
      showToast(lang === "tr" ? "Kaydedildi ♡" : "Saved ♡");
    }
  };

  const rActiveIndex = step === "idle" ? 0 : 45;
  const gActiveIndex = (step === "idle" || step === "spinningRecipients") ? 0 : 45;

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(27,22,17,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-up" style={{ background: "var(--cream)", borderRadius: 16, padding: "48px 56px", maxWidth: 600, width: "100%", border: "1px solid var(--rule)", position: "relative", overflow: "hidden" }}>
        
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 20, background: "transparent", border: 0, fontSize: 24, cursor: "pointer", color: "var(--muted)", zIndex: 10 }}>×</button>
        
        <div className="col gap-24 items-center text-center">
          <div className="col gap-8">
            <div className="eyebrow">{lang === "tr" ? "ŞANSLI HEDİYE" : "LUCKY GIFT"}</div>
            <h2 className="serif" style={{ fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
              {lang === "tr" ? "Kararsız mısın?" : "Can't decide?"}<br/>
              <GradientText animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>
                {lang === "tr" ? "Çarkı Çevir!" : "Spin the Wheel!"}
              </GradientText>
            </h2>
          </div>

          <div className="col gap-16" style={{ width: "100%" }}>
            
            {/* Slot 1: Kime? */}
            <div className="col gap-8">
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", alignSelf: "flex-start" }}>{lang === "tr" ? "KİME?" : "FOR WHOM?"}</span>
              <div style={{ height: ITEM_HEIGHT, background: "var(--bone)", borderRadius: 8, overflow: "hidden", position: "relative", border: "1px solid var(--rule)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ 
                  transform: `translateY(-${rActiveIndex * ITEM_HEIGHT}px)`, 
                  transition: step === "idle" ? "none" : `transform ${SPIN_DURATION}s cubic-bezier(0.1, 0.7, 0.1, 1)` 
                }}>
                  {recipientList.map((r, i) => (
                    <div key={i} className="serif" style={{ height: ITEM_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "var(--ink)", fontWeight: 500 }}>
                      {r}
                    </div>
                  ))}
                </div>
                {/* Gradient Masks */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 16, background: "linear-gradient(to bottom, var(--bone), transparent)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 16, background: "linear-gradient(to top, var(--bone), transparent)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Slot 2: Ne? */}
            <div className="col gap-8">
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", alignSelf: "flex-start" }}>{lang === "tr" ? "NE?" : "WHAT?"}</span>
              <div style={{ height: ITEM_HEIGHT, background: "var(--bone)", borderRadius: 8, overflow: "hidden", position: "relative", border: "1px solid var(--rule)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ 
                  transform: `translateY(-${gActiveIndex * ITEM_HEIGHT}px)`, 
                  transition: (step === "idle" || step === "spinningRecipients") ? "none" : `transform ${SPIN_DURATION}s cubic-bezier(0.1, 0.7, 0.1, 1)` 
                }}>
                  {giftList.map((g, i) => (
                    <div key={i} className="row gap-12 items-center" style={{ height: ITEM_HEIGHT, padding: "0 16px" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "var(--cream-2)" }}>
                        {g.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={g.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: `var(--${g.tone})` }} />
                        )}
                      </div>
                      <div className="col" style={{ flex: 1, minWidth: 0 }}>
                        <span className="serif" style={{ fontSize: 18, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</span>
                        <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{g.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Gradient Masks */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: "linear-gradient(to bottom, var(--bone), transparent)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 12, background: "linear-gradient(to top, var(--bone), transparent)", pointerEvents: "none" }} />
              </div>
            </div>

          </div>

          <div className="col gap-12" style={{ width: "100%", marginTop: 8 }}>
            {step === "done" ? (
              <div className="row gap-12">
                <button className="btn btn-bone btn-lg" onClick={handleSpin} style={{ flex: 1, justifyContent: "center" }}>
                  ↻ {lang === "tr" ? "Tekrar Çevir" : "Spin Again"}
                </button>
                <button className="btn btn-coral btn-lg" onClick={handleSave} style={{ flex: 1, justifyContent: "center" }}>
                  ♡ {lang === "tr" ? "Listeye Ekle" : "Save"}
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-coral btn-lg" 
                onClick={handleSpin} 
                disabled={step !== "idle"} 
                style={{ width: "100%", justifyContent: "center", opacity: step !== "idle" ? 0.7 : 1, transition: "opacity 0.2s" }}
              >
                {step === "idle" ? (lang === "tr" ? "Çarkı Çevir" : "Spin the Wheel") : (lang === "tr" ? "Dönüyor..." : "Spinning...")}
              </button>
            )}
            
            {step === "done" && giftList[45] && (
               <a 
                 href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(giftList[45].name)}`} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="btn btn-ghost" 
                 style={{ justifyContent: "center", fontSize: 13 }}
               >
                 {lang === "tr" ? "Ürünü İncele ↗" : "View Product ↗"}
               </a>
            )}
          </div>
        </div>

        {toast && (
          <div className="fade-up" style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--cream)", padding: "10px 16px", borderRadius: 999, fontSize: 13, zIndex: 60, boxShadow: "0 10px 30px rgba(27,22,17,0.2)", whiteSpace: "nowrap" }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
