import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, QrCode, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * QRModal — Generates and displays a QR code for the card URL.
 *
 * Includes a download button that exports the QR code as a PNG.
 *
 * @param {string} url - The full URL to encode (e.g., https://referralsvc.com/c/jamarr)
 * @param {string} name - Card holder name for the title
 * @param {string} themeColor - QR code foreground color
 */
export default function QRModal({ url, name, themeColor = "#6d5cff" }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = () => {
    const svg = document.getElementById("dbc-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);

      const link = document.createElement("a");
      link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl
                   border border-surface-border bg-surface-light/50 hover:bg-surface-light
                   text-gray-300 hover:text-white transition-all duration-200
                   cursor-pointer"
      >
        <QrCode size={18} />
        <span className="text-sm font-medium">Show QR Code</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Scan to Connect
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-6 bg-white rounded-xl mb-4">
                <QRCodeSVG
                  id="dbc-qr-code"
                  value={url}
                  size={240}
                  bgColor="#ffffff"
                  fgColor={themeColor}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Name & URL */}
              <p className="text-center text-sm text-gray-400 mb-4 truncate">
                {url}
              </p>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4
                           rounded-xl bg-primary hover:bg-primary/80 text-white
                           font-medium transition-colors cursor-pointer"
              >
                <Download size={16} />
                Save QR Code
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
