import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BannerCarousel from "../components/BannerCarousel";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, MessageSquare, Send } from "lucide-react";
import CandidatureModal from "../components/CandidatureModal";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import FriendSuggestions from "../components/FriendSuggestions";

export default function Dashboard({ user: propUser }) {
  const [user, setUser] = useState(propUser);
  const [banners, setBanners] = useState([]);
  const [showCandidatureModal, setShowCandidatureModal] = useState(false);
  const [userData, setUserData] = useState(user);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const socketRef = useRef(null);

  // --- CHAT ---
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const chatEndRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const showLeft = showLeftSidebar || windowWidth >= 768;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const me = await api.get("/users/me");
        setUser(me.data);
        setUserData(me.data);

        const bannersData = await api.get("/banners");
        setBanners(bannersData.data);

      } catch (err) {
        console.error("Erreur fetch dashboard:", err);
      }
    };
    fetchData();
  }, []);


  // Resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

const handleSavePhoto = async () => {
  if (!selectedFile) return alert("Veuillez sélectionner une photo !");

  try {
    const formData = new FormData();
    formData.append("image", selectedFile); // ne change pas ce nom !

    // 1️⃣ Upload vers Cloudinary via backend
    const uploadRes = await api.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const cloudUrl = uploadRes.data.url; // URL Cloudinary

    // 2️⃣ Mettre à jour l’utilisateur dans ta DB
    const updateRes = await api.put("/users/me/photo", {
      photoUrl: cloudUrl,
    });

    setUser(updateRes.data);
    setSelectedFile(null);
    setPreview(updateRes.data.photoUrl);

    alert("Photo mise à jour !");
  } catch (err) {
    console.error(err);
    alert("Erreur lors de la mise à jour !");
  }
};


 // 🔹 Récupération messages au montage
    useEffect(() => {
    const fetchChatMessages = async () => {
      try {
        const res = await api.get("/messages-pro/me"); // messages du candidat
        const messages = Array.isArray(res.data) ? res.data : [res.data];

        // 👉 Ici : on garde seulement une instance par "content" et "createdAt"
      const uniqueMessages = messages.reduce((acc, msg) => {
        if (!acc.some(m => 
          m.content === msg.content &&
          m.senderId === msg.senderId &&
          Math.abs(new Date(m.createdAt) - new Date(msg.createdAt)) < 1000 // même timestamp ≈ même message
        )) {
          acc.push(msg);
        }
        return acc;
      }, []);

        setChatMessages(uniqueMessages);
        scrollToBottom();
      } catch (err) {
        console.error("Erreur fetch messages:", err);
      }
    };
    
  fetchChatMessages();
}, []);

// Envoi de message côté candidat
const sendChatMessage = async () => {
  if (!newChatMessage.trim()) return;

  try {
    const res = await api.post("/messages-pro", { content: newChatMessage });

    // Le backend renvoie un tableau (un message par destinataire)
    // Candidat ne voit que le premier message
    const sentMessage = Array.isArray(res.data) ? res.data[0] : res.data;

    setChatMessages(prev => {
        if (prev.find(m => m.id === sentMessage.id)) return prev; // éviter doublon
        return [...prev, sentMessage];
      });

      setNewChatMessage("");
      scrollToBottom();

      // envoyer au socket pour realtime
      socketRef.current?.emit("sendMessage", sentMessage);
    } catch (err) {
      console.error("Erreur envoi message:", err);
    }
  };

  // Scroll automatique
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ✅ Récupérer les non lus au démarrage
useEffect(() => {
  const fetchUnread = async () => {
    try {
      const res = await api.get("/messages-pro/unread/counts");
      const counts = res.data || {};
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      setUnreadCount(total);
    } catch (err) {
      console.error("Erreur récupération non lus:", err);
    }
  };

  if (user) fetchUnread();
}, [user]);

// ✅ Marquer comme lus quand le chat s’ouvre
const toggleChatPopup = async () => {
  const next = !showChatPopup;
  setShowChatPopup(next);

  if (next) {
    try {
      // 🔹 Récupérer tous les messages non lus avant de les marquer comme lus
      const unreadRes = await api.get("/messages-pro/unread/counts");
      const counts = unreadRes.data || {};
      const senderIds = Object.keys(counts);

      // 🔹 Marquer tous les messages comme lus, peu importe le sender
      for (const senderId of senderIds) {
        await api.put(`/messages-pro/seen/${senderId}`);
      }

      // 🔹 Puis rafraîchir le compteur
      const refreshRes = await api.get("/messages-pro/unread/counts");
      const newCounts = refreshRes.data || {};
      const total = Object.values(newCounts).reduce((a, b) => a + b, 0);
      setUnreadCount(total);

      socketRef.current?.emit("markAsRead", { userId: user.id });
    } catch (err) {
      console.error("Erreur markAsSeen (candidat):", err);
    }
  }
};


// ✅ Écouter le compteur temps réel
useEffect(() => {
  if (!user) return;
  const socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ["websocket"] });

  socket.emit("register", user.id);

  socket.on("newMessage", (msg) => {
    if (msg.senderId !== user.id) {
      setUnreadCount((prev) => prev + 1);
    }
    setChatMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    scrollToBottom();
  });

  // 🔔 Nouveau : écoute de la mise à jour du compteur
  socket.on("unreadCountUpdated", async () => {
    try {
      const res = await api.get("/messages-pro/unread/counts");
      const counts = res.data || {};
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      setUnreadCount(total);
    } catch (err) {
      console.error("Erreur mise à jour compteur:", err);
    }
  });

  socketRef.current = socket;

  return () => socket.disconnect();
}, [user]);

  // 🔹 Scroll automatique quand le chat s'ouvre ou que les messages changent
useEffect(() => {
  if (showChatPopup && chatMessages.length > 0) {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100); // petit délai pour laisser le DOM finir le rendu
    return () => clearTimeout(timer);
  }
}, [showChatPopup, chatMessages]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-black">
      <Navbar user={user} onSearchChange={setSearchTerm} />
      {windowWidth < 768 && (
        <div className="flex justify-start bg-blue-900 p-2 shadow">
          <button
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowLeftSidebar(true)}
          >
            <Menu size={18} /> Profil
          </button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <AnimatePresence>
          {showLeft && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-64 bg-blue-900 shadow p-4 h-screen overflow-y-auto absolute md:relative z-50"
            >
              {windowWidth < 768 && (
                <button
                  className="mb-3 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => setShowLeftSidebar(false)}
                >
                  ✕ Fermer
                </button>
              )}
              <h2 className="text-lg font-bold mb-4 text-white">Mon Profil</h2>
              <motion.img
                layoutId="candidate-photo"
                src={preview || user?.photoUrl || "/default-avatar.png"}
                alt="candidate avatar"
                className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white cursor-pointer hover:opacity-80"
                onClick={() => setShowPopup(true)}
              />
              <label className="bg-blue-600 text-white px-3 py-1 rounded cursor-pointer hover:bg-blue-700 text-sm mb-2 block text-center">
                Changer la photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <button
                  onClick={handleSavePhoto}
                  className="block mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full"
                >
                  Sauvegarder
                </button>
              )}
              <h2 className="text-md font-semibold mt-4 text-white text-center">
                {user?.nom} {user?.postnom} {user?.prenom}
              </h2>
              <div className="mt-4 text-left space-y-1 text-sm text-white">
                <p><strong>Email :</strong> {user?.email}</p>
                <p><strong>Téléphone :</strong> {user?.tel || "—"}</p>
                <p><strong>Adresse :</strong> {user?.adresse || "—"}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          
        {/* CONTENU PRINCIPAL */}
        <div className="flex-1 flex flex-col justify-start overflow-y-auto px-4 pt-6">
          <div className="flex items-center justify-between px-3 py-0 mb-1">
                <h3 className="bg-gradient-to-r from-red-900 to-yellow-600 text-white py-2 px-2 rounded-xl flex justify-center gap-1 text-xl font-bold whitespace-nowrap transition transform hover:scale-105">
                Suggestions des collègues
                </h3>
              
          {/* Statut candidature */}
          <div className="flex flex-wrap justify-end gap-3 mb-6">
            {userData?.candidatureStatus === "NON_POSTULE" && (
              <button
                onClick={() => setShowCandidatureModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-2 rounded-xl shadow-lg hover:shadow-2xl hover:from-blue-700 hover:to-blue-600 transition-all"
              >
                Postuler à la compétition
              </button>
            )}
            {userData?.candidatureStatus === "EN_ATTENTE" && (
              <div className="flex items-center gap-2 bg-yellow-600 text-yellow-50 px-3 py-1 rounded-xl shadow-lg hover:shadow-2xl hover:from-yellow-700 hover:to-yellow-600 transition-all">
                <Clock size={18} /> En attente de confirmation
              </div>
            )}
            {userData?.candidatureStatus === "ACCEPTE" && (
              <div className="flex items-center gap-2 bg-green-600 text-green-50 px-5 py-2 rounded-xl shadow-lg hover:shadow-2xl hover:from-green-700 hover:to-green-600">
                <CheckCircle size={18} /> Candidature acceptée
              </div>
            )}
            {userData?.candidatureStatus === "REFUSE" && (
              <div className="flex items-center gap-2 bg-red-600 text-red-50 px-3 py-1 rounded-xl shadow-lg hover:shadow-2xl hover:from-red-700 hover:to-red-600 transition-all">
                <XCircle size={18} /> Candidature refusée
              </div>
            )}
          </div>
          </div>
          <CandidatureModal
            isOpen={showCandidatureModal}
            onClose={() => setShowCandidatureModal(false)}
            onSuccess={(updatedUser) => setUserData(updatedUser)}
          />


          {/* FriendSuggestions */}
          <div className="relative py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl shadow-inner">     
            <div className="absolute top-0 left-0 w-10 h-full bg-gradient-to-r from-black/20 to-transparent rounded-l-xl pointer-events-none z-10"></div>
            <div className="absolute top-0 right-0 w-10 h-full bg-gradient-to-l from-black/20 to-transparent rounded-r-xl pointer-events-none z-10"></div>
            <div className="overflow-x-auto scroll-smooth scrollbar-thin scrollbar-thumb-gray-400/40 scrollbar-track-transparent px-2 py-2">
              <div className="flex gap-4 w-max snap-x snap-mandatory">
                <FriendSuggestions searchTerm={searchTerm} />
              </div>
            </div>
          </div>
         

          {/* Banner */}
          <div className="relative mt-4">
            <div className="w-full overflow-hidden rounded-2xl shadow-lg">
              <BannerCarousel banners={banners} />
            </div>
          </div>
        </div>
      </div>

      {/* Popup photo */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowPopup(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-red-700 transition"
            >
              ✕
            </button>
            <motion.img
              layoutId="candidate-photo"
              src={preview || user?.photoUrl || "/default-avatar.png"}
              alt="photo candidate"
              className="max-w-lg max-h-[80%] rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

       {/* BOUTON CHAT */}
        <button
          onClick={toggleChatPopup}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl flex items-center gap-2 transition z-[99999]"
        >
          <div className="relative">
            <MessageSquare size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-md min-w-[18px] text-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="hidden md:inline">Chat</span>
        </button>
      {/* CHAT POPUP */}
      <AnimatePresence>
        {showChatPopup && (
          <motion.div
            className="fixed bottom-20 right-6 z-50"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <motion.div
              className="bg-blue-50 w-96 h-[500px] md:h-96 rounded-xl shadow-xl flex flex-col overflow-hidden border border-blue-400"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
                <h3 className="font-semibold">Chat avec l’équipe</h3>
                <button onClick={toggleChatPopup}>✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl max-w-[70%] ${
                      msg.senderId === user.id
                        ? "bg-blue-600 text-white self-end"
                        : "bg-gray-200 text-gray-800 self-start"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                <div ref={chatEndRef}></div>
              </div>

              <div className="flex p-3 gap-2 border-t">
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 border rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendChatMessage();
                  }}
                />
                <button
                  onClick={sendChatMessage}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 flex items-center"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
