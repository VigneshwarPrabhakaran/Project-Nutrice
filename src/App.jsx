// src/App.jsx
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, addDoc, updateDoc, doc, setDoc,
  onSnapshot, query, orderBy 
} from 'firebase/firestore';
import { INITIAL_POPSICLES } from './defaultItems';
import { 
  Play, Square, Plus, Minus, ShoppingBag, Trash2, Edit3, Check, 
  LayoutDashboard, History, Settings, Sparkles, X, AlertCircle, CheckCircle2, 
  ChevronDown, ChevronUp, Receipt, PauseCircle, PlayCircle
} from 'lucide-react';

const GREETINGS = [
  "✨ Today is your luckiest day!",
  "🚀 Big sales are coming your way today!",
  "🍦 Every customer leaves with a smile!",
  "🌟 Watch those popsicles fly off the shelf!",
  "📈 Today's goal: record-breaking sales!",
  "💪 Your hard work is paying off today!",
  "🍓 Fresh pops, big profits, unstoppable energy!",
  "✨ Today is full of new opportunities!",
  "🏗️ You are building something incredible!",
  "🔥 Ready, set, crush today's sales!",
  "💸 May your freezer stay full and your cash register fuller!",
  "🎉 Best of sales to you today!",
  "☀️ Today’s forecast: 100% chance of success!",
  "👑 Turning sweet treats into big dreams today!",
  "⏳ Great things take time—keep going!",
  "🛣️ Enjoy the journey, step by step!",
  "❤️ Trust the process and love the hustle!",
  "🌱 Every big brand started small!",
  "🏰 Rome wasn't built in a day, but your dream is growing!",
  "🎯 Focus on progress, not perfection!",
  "🌈 The best is yet to come for your shop!",
  "🪜 One pop, one customer, one step closer!",
  "👏 Be proud of how far you’ve already come!",
  "🏆 Small daily wins lead to massive success!",
  "🚀 Today is another step toward your big dream!",
  "🔥 Patience, passion, and persistence!",
  "⚡ You are the boss of your own destiny!",
  "💖 Believe in your passion today!",
  "🏁 You’ve got the vision, now go execute!",
  "✨ Your energy sets the vibe for the store!",
  "💡 Turn challenges into opportunities today!",
  "🍭 Show the world how sweet success can be!",
  "🧠 Stronger, wiser, and better every day!",
  "🌟 Shine bright, run your shop like a pro!",
  "🦸‍♀️ Your dedication is your secret superpower!",
  "👑 Own the day like the founder you are!",
  "🎯 Stay focused, stay driven, stay sweet!",
  "😌 Take a breath—you’ve got this handled!",
  "💼 Make today a masterclass in hustle!"
];

const COLOR_OPTIONS = [
  { label: "Red / Rose", value: "bg-rose-500" },
  { label: "Orange", value: "bg-orange-500" },
  { label: "Yellow / Amber", value: "bg-amber-400" },
  { label: "Green / Emerald", value: "bg-emerald-500" },
  { label: "Blue / Sky", value: "bg-sky-500" },
  { label: "Indigo", value: "bg-indigo-600" },
  { label: "Violet / Purple", value: "bg-purple-600" },
  { label: "Pink", value: "bg-pink-400" },
  { label: "Brown / Chocolate", value: "bg-amber-800" },
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState("session");
  const [greeting, setGreeting] = useState("");
  
  const [items, setItems] = useState(INITIAL_POPSICLES);
  const [selectedTier, setSelectedTier] = useState("All");
  const [activeSession, setActiveSession] = useState(null);
  
  // Register & Bill State
  const [cart, setCart] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null); // Preserves ID if resuming a held order
  const [heldBills, setHeldBills] = useState([]);
  
  const [sessionSales, setSessionSales] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  
  // UI States
  const [editingItemId, setEditingItemId] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Fruit");
  const [newItemColor, setNewItemColor] = useState("bg-rose-500");
  const [completedSummary, setCompletedSummary] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  const showNotification = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    const randomGreet = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    setGreeting(randomGreet);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // 1. Firebase Sync & Catalog Seeding
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menu_items"), async (snapshot) => {
      if (snapshot.empty || snapshot.docs.length < 42) {
        for (const pop of INITIAL_POPSICLES) {
          await setDoc(doc(db, "menu_items", pop.id), pop, { merge: true });
        }
      } else {
        const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(fetchedItems);
      }
    }, (error) => {
      console.warn("Using offline catalog fallback:", error);
    });
    return () => unsubscribe();
  }, []);

  // 2. Firebase Sync: Active & Past Sessions
  useEffect(() => {
    const q = query(collection(db, "sessions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const active = allSessions.find(s => s.status === "ACTIVE");
      const closed = allSessions.filter(s => s.status === "CLOSED");
      
      setActiveSession(active || null);
      setPastSessions(closed);
    });
    return () => unsubscribe();
  }, []);

  // 3. Firebase Sync: Active Session Orders
  useEffect(() => {
    if (!activeSession) {
      setSessionSales([]);
      return;
    }
    const q = query(collection(db, `sessions/${activeSession.id}/orders`), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessionSales(sales);
    });
    return () => unsubscribe();
  }, [activeSession]);

  const getFormattedDateCode = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleStartSession = async () => {
    const dateCode = getFormattedDateCode();
    const todaySessionsCount = pastSessions.filter(s => s.id.startsWith(dateCode)).length;
    const newSessionNumber = todaySessionsCount + 1;
    const sessionId = `${dateCode}-S${newSessionNumber}`;

    try {
      await setDoc(doc(db, "sessions", sessionId), {
        id: sessionId,
        startTime: new Date().toLocaleString(),
        status: "ACTIVE",
        createdAt: new Date().toISOString()
      });
      showNotification(`Session ${sessionId} opened!`, "success");
    } catch (e) {
      showNotification("Database error: Could not open session", "error");
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    if (heldBills.length > 0) {
      showNotification(`Please resolve or clear the ${heldBills.length} held bill(s) first!`, "error");
      setActiveTab("held");
      return;
    }

    const totalRevenue = sessionSales.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalItems = sessionSales.reduce((acc, curr) => acc + curr.totalItems, 0);
    
    const closedSessionRecord = {
      id: activeSession.id,
      date: new Date().toLocaleDateString(),
      time: activeSession.startTime + " - " + new Date().toLocaleTimeString(),
      totalRevenue,
      totalItems,
      ordersCount: sessionSales.length,
      sales: sessionSales,
      status: "CLOSED"
    };

    try {
      await updateDoc(doc(db, "sessions", activeSession.id), closedSessionRecord);
      setCompletedSummary(closedSessionRecord);
      setCart([]);
      setActiveOrderId(null);
      setHeldBills([]);
    } catch (e) {
      showNotification("Database error: Could not end session", "error");
    }
  };

  const addToCart = (popsicle) => {
    if (!activeSession) {
      showNotification("Please tap 'Start Day' to open a session first!", "error");
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === popsicle.id);
      if (existing) {
        return prev.map(i => i.id === popsicle.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...popsicle, qty: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  // Park / Hold Current Bill
  const handleHoldBill = () => {
    if (cart.length === 0 || !activeSession) return;

    // Use current activeOrderId or mint a new one based on completed + held orders count
    const billOrderId = activeOrderId || `${activeSession.id}-ORD${sessionSales.length + heldBills.length + 1}`;
    const totalAmount = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);

    const heldRecord = {
      orderId: billOrderId,
      items: [...cart],
      totalAmount,
      totalItems,
      heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHeldBills(prev => [heldRecord, ...prev]);
    setCart([]);
    setActiveOrderId(null);
    showNotification(`Bill ${billOrderId} parked on hold!`, "success");
  };

  // Resume a Parked Bill
  const handleResumeBill = (billToResume) => {
    if (cart.length > 0) {
      showNotification("Current register has items. Please record or hold them first!", "error");
      return;
    }
    setCart(billToResume.items);
    setActiveOrderId(billToResume.orderId);
    setHeldBills(prev => prev.filter(b => b.orderId !== billToResume.orderId));
    setActiveTab("session");
    showNotification(`Resumed ${billToResume.orderId}`, "success");
  };

  // Discard a Parked Bill
  const handleDiscardHeldBill = (orderId) => {
    setHeldBills(prev => prev.filter(b => b.orderId !== orderId));
    showNotification(`Held bill ${orderId} discarded`, "error");
  };

  // Complete / Record Active Sale
  const handleCheckout = async () => {
    if (cart.length === 0 || !activeSession) return;
    const totalAmount = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
    
    const finalOrderId = activeOrderId || `${activeSession.id}-ORD${sessionSales.length + 1}`;

    const newOrder = {
      id: finalOrderId,
      items: cart,
      totalAmount,
      totalItems,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, `sessions/${activeSession.id}/orders`, finalOrderId), newOrder);
      setCart([]);
      setActiveOrderId(null);
      showNotification(`Order ${finalOrderId} recorded!`, "success");
    } catch (e) {
      showNotification("Database error: Could not save sale", "error");
    }
  };

  const savePriceEdit = async (id) => {
    const newP = parseFloat(tempPrice);
    if (!isNaN(newP) && newP > 0) {
      try {
        await updateDoc(doc(db, "menu_items", id), { price: newP });
        showNotification("Price updated!", "success");
      } catch (e) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, price: newP } : i));
        showNotification("Price updated!", "success");
      }
    }
    setEditingItemId(null);
  };

  const handleAddPopsicle = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;
    const newId = 'p-' + Date.now();
    const newItem = {
      id: newId,
      name: newItemName,
      price: parseFloat(newItemPrice),
      category: newItemCategory,
      color: newItemColor
    };
    
    try {
      await setDoc(doc(db, "menu_items", newId), newItem);
    } catch (e) {
      setItems(prev => [...prev, newItem]);
    }
    setNewItemName("");
    setNewItemPrice("");
    showNotification("New popsicle added to menu!", "success");
  };

  const currentTotal = sessionSales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const cartTotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);

  const filteredItems = (selectedTier === "All" 
    ? items 
    : items.filter(item => item.price === parseInt(selectedTier))
  ).sort((a, b) => a.price - b.price);

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-rose-500 text-white flex flex-col justify-between items-center p-8 z-50 text-center max-w-md mx-auto">
        <div className="my-auto space-y-6">
          <div className="bg-white/20 p-5 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <Sparkles size={48} className="text-amber-300" />
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-wider uppercase">NUTRICE</h1>
            <p className="text-xs text-rose-100 font-medium tracking-wide mt-1">Popsicle Store POS</p>
          </div>

          <div className="bg-white/10 p-6 rounded-3xl border border-white/20 shadow-xl max-w-xs mx-auto">
            <p className="text-lg font-black tracking-wide text-amber-200">{greeting}</p>
          </div>
        </div>

        <div className="text-[11px] text-rose-200 font-medium">
          Loading Store Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-64 max-w-md mx-auto relative shadow-2xl flex flex-col font-sans">
      
      {/* CUSTOM IN-APP NOTIFICATION POPUP */}
      {toast && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-sm mx-auto">
          <div className={`p-3.5 rounded-2xl shadow-xl border flex items-center justify-between text-xs font-bold transition-all ${
            toast.type === 'error' 
              ? 'bg-slate-900 text-rose-300 border-rose-500/30' 
              : 'bg-slate-900 text-emerald-300 border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-2.5">
              {toast.type === 'error' ? (
                <AlertCircle size={18} className="text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-2">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-rose-500 text-white p-4 sticky top-0 z-30 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-wide">NUTRICE</h1>
          <p className="text-[11px] text-rose-100 font-medium">Popsicle POS System</p>
        </div>
        
        {activeSession ? (
          <button 
            onClick={handleEndSession}
            className="flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow"
          >
            <Square size={13} /> End Day
          </button>
        ) : (
          <button 
            onClick={handleStartSession}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow animate-pulse"
          >
            <Play size={13} /> Start Day
          </button>
        )}
      </header>

      {/* TAB 1: SESSION / POS */}
      {activeTab === "session" && (
        <div className="flex-1 p-3">
          {activeOrderId && (
            <div className="bg-amber-500 text-white px-3 py-1.5 rounded-xl mb-3 flex items-center justify-between text-xs font-bold shadow-xs">
              <span className="flex items-center gap-1.5">
                <PlayCircle size={15} /> Resumed Order: {activeOrderId}
              </span>
              <button 
                onClick={() => { setActiveOrderId(null); setCart([]); }} 
                className="text-[10px] underline hover:text-amber-100"
              >
                Cancel Ticket
              </button>
            </div>
          )}

          <div className="bg-white p-4 mb-3 rounded-2xl shadow-xs border border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {activeSession ? `Active (${activeSession.id})` : 'Active Session Revenue'}
              </span>
              <div className="text-2xl font-black text-slate-800">₹{currentTotal}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orders Count</span>
              <div className="text-lg font-bold text-rose-500">{sessionSales.length} orders</div>
            </div>
          </div>

          {/* Price Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
            {["All", "10", "25", "30", "40", "50"].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedTier === tier 
                    ? "bg-rose-500 text-white shadow-md scale-105" 
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {tier === "All" ? `All (${items.length})` : `₹${tier}`}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center mb-2.5">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Menu & Flavors ({filteredItems.length})</h2>
            <span className="text-[11px] text-slate-400 font-medium">Tap to add quantity</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {filteredItems.map((popsicle) => (
              <div key={popsicle.id} className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex flex-col justify-between">
                <div className={`h-2.5 w-full ${popsicle.color || 'bg-rose-400'} rounded-full mb-2`} />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight">{popsicle.name}</h3>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">{popsicle.category}</span>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <span className="font-black text-slate-800 text-sm">₹{popsicle.price}</span>
                  <button 
                    onClick={() => addToCart(popsicle)}
                    className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-500 hover:text-white transition-colors flex items-center gap-1 text-xs shadow-xs"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: HELD BILLS */}
      {activeTab === "held" && (
        <div className="flex-1 p-3 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Held / Parked Bills</h2>
            <span className="text-xs font-semibold text-amber-600">{heldBills.length} on hold</span>
          </div>

          {heldBills.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 mt-10">
              <PauseCircle size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No held bills right now</p>
              <p className="text-xs text-slate-400 mt-1">When parallel customers arrive, tap "Hold Bill" in the cart to park their order here.</p>
            </div>
          ) : (
            heldBills.map((bill) => (
              <div key={bill.orderId} className="bg-white rounded-2xl shadow-xs border border-slate-200 p-3.5 space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                      {bill.orderId}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-2">Held at {bill.heldAt}</span>
                  </div>
                  <span className="text-sm font-black text-rose-600">₹{bill.totalAmount}</span>
                </div>

                <div className="text-xs space-y-1 divide-y divide-slate-50">
                  {bill.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600 pt-1 first:pt-0">
                      <span>{item.name} <span className="text-slate-400 font-bold">x{item.qty}</span></span>
                      <span className="font-semibold text-slate-800">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => handleResumeBill(bill)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                  >
                    <PlayCircle size={14} /> Resume Bill
                  </button>
                  <button 
                    onClick={() => handleDiscardHeldBill(bill.orderId)}
                    className="px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center shadow-xs"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === "history" && (
        <div className="flex-1 p-3 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Past Sessions & Reports</h2>
            <span className="text-xs font-semibold text-rose-500">{pastSessions.length} sessions logged</span>
          </div>

          {pastSessions.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 mt-10">
              <History size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No past sessions recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Sessions and revenue reports will appear here once you close a working day.</p>
            </div>
          ) : (
            pastSessions.map((session) => {
              const isExpanded = expandedSessionId === session.id;
              return (
                <div key={session.id} className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden transition-all">
                  <button 
                    onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                    className="w-full p-4 text-left flex justify-between items-center hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-100">{session.id}</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Completed</span>
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-sm">{session.date}</h3>
                      <p className="text-[10px] text-slate-400">Time: {session.time}</p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-base font-black text-emerald-600">₹{session.totalRevenue}</span>
                        <p className="text-[10px] text-slate-400">{session.ordersCount} sales • {session.totalItems} pops</p>
                      </div>
                      {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-slate-50/80 border-t border-slate-100 p-3.5 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200">
                        <span className="flex items-center gap-1"><Receipt size={14} /> Itemized Sales Breakdown</span>
                        <span>{session.sales?.length || 0} Transactions</span>
                      </div>

                      {session.sales?.map((order, idx) => (
                        <div key={order.id || idx} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 text-xs">
                            <span className="font-extrabold text-slate-700">{order.id} • <span className="text-slate-400 font-normal">{order.time}</span></span>
                            <span className="font-black text-rose-500">Total: ₹{order.totalAmount}</span>
                          </div>

                          <div className="space-y-1 text-xs">
                            {order.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex justify-between text-slate-600">
                                <span>{item.name} <span className="text-slate-400 font-bold">x{item.qty}</span></span>
                                <span className="font-semibold text-slate-800">₹{item.price * item.qty}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="bg-rose-500 text-white p-3 rounded-xl flex justify-between items-center font-bold text-xs shadow-xs">
                        <span>Grand Session Summation</span>
                        <span className="text-sm font-black">₹{session.totalRevenue}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: EDITABLES */}
      {activeTab === "editables" && (
        <div className="flex-1 p-3 space-y-4">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Manage Prices & Items</h2>

          <form onSubmit={handleAddPopsicle} className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-3">
            <h3 className="font-bold text-xs text-slate-700 uppercase">Add New Popsicle Flavor</h3>
            
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Flavor Name (e.g. Lime Mint)" 
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-rose-500"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
              />
              
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" 
                  placeholder="Price (₹)" 
                  className="text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-rose-500"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  required
                />
                
                <select 
                  className="text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-rose-500 bg-white font-medium text-slate-700"
                  value={newItemColor}
                  onChange={(e) => setNewItemColor(e.target.value)}
                >
                  {COLOR_OPTIONS.map((col) => (
                    <option key={col.value} value={col.value}>
                      🎨 {col.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-rose-500 text-white text-xs font-bold py-2.5 rounded-lg shadow-xs hover:bg-rose-600 transition-colors">
              Add to Catalog
            </button>
          </form>

          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-3">
            <h3 className="font-bold text-xs text-slate-700 uppercase">Edit Existing Prices ({items.length})</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color || 'bg-rose-400'}`} />
                    <div>
                      <span className="font-bold text-slate-700">{item.name}</span>
                      <span className="block text-[10px] text-slate-400">{item.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingItemId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          className="w-14 text-xs border border-rose-300 rounded p-1" 
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                        />
                        <button onClick={() => savePriceEdit(item.id)} className="bg-emerald-500 text-white p-1 rounded">
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800">₹{item.price}</span>
                        <button 
                          onClick={() => { setEditingItemId(item.id); setTempPrice(item.price); }} 
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CART SHEET WITH RECORD & HOLD ACTIONS */}
      {activeTab === "session" && cart.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto pointer-events-none z-20 px-2">
          <div className="bg-white/95 border border-slate-200 rounded-2xl shadow-2xl p-3.5 pointer-events-auto backdrop-blur-md">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-rose-500" /> Current Order ({cart.reduce((a, b) => a + b.qty, 0)})
                {activeOrderId && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold">[{activeOrderId}]</span>}
              </span>
              <button 
                onClick={() => { setCart([]); setActiveOrderId(null); }} 
                className="text-[11px] text-rose-400 font-semibold flex items-center gap-0.5 hover:text-rose-600"
              >
                <Trash2 size={12} /> Clear
              </button>
            </div>

            <div className="max-h-20 overflow-y-auto space-y-1.5 mb-2.5 pr-1 divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs pt-1 first:pt-0">
                  <span className="font-bold text-slate-700 truncate max-w-[140px]">{item.name}</span>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                      <button onClick={() => updateCartQty(item.id, -1)} className="p-1 text-slate-600 hover:text-rose-500"><Minus size={10} /></button>
                      <span className="font-black px-1.5 text-slate-800">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="p-1 text-slate-600 hover:text-rose-500"><Plus size={10} /></button>
                    </div>
                    <span className="font-black text-slate-800 w-12 text-right">₹{item.price * item.qty}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {/* Hold Action Button */}
              <button 
                onClick={handleHoldBill}
                className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1 shadow-md text-xs transition-all"
              >
                <PauseCircle size={14} />
                <span>Hold Bill</span>
              </button>

              {/* Complete Action Button */}
              <button 
                onClick={handleCheckout}
                className="flex-1 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white py-2 rounded-xl font-bold flex justify-between items-center px-3 shadow-md text-xs transition-all"
              >
                <span>Record Sale</span>
                <span className="text-sm font-black">₹{cartTotal} →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SESSION SUMMARY POPUP MODAL */}
      {completedSummary && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase">Session Summary</span>
                <h3 className="font-black text-slate-800 text-base">Day Closed Successfully!</h3>
              </div>
              <button onClick={() => setCompletedSummary(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">Total Revenue Generated</span>
              <div className="text-3xl font-black text-emerald-600">₹{completedSummary.totalRevenue}</div>
              <p className="text-xs text-slate-500 pt-1">{completedSummary.ordersCount} orders fulfilled • {completedSummary.totalItems} popsicles sold</p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Session ID:</span>
                <span className="font-bold text-slate-800">{completedSummary.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Active Hours:</span>
                <span className="font-bold text-slate-800">{completedSummary.date}</span>
              </div>
            </div>

            <button 
              onClick={() => setCompletedSummary(null)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold text-xs shadow-md"
            >
              Done & Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION WITH HELD TAB & BADGE */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 h-16 flex justify-around items-center z-30 shadow-lg">
        <button 
          onClick={() => setActiveTab("session")}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors ${activeTab === "session" ? "text-rose-500 font-bold" : "text-slate-400 font-medium"}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px]">Session</span>
        </button>

        <button 
          onClick={() => setActiveTab("held")}
          className={`relative flex flex-col items-center gap-1 flex-1 py-1 transition-colors ${activeTab === "held" ? "text-amber-500 font-bold" : "text-slate-400 font-medium"}`}
        >
          <div className="relative">
            <PauseCircle size={20} />
            {heldBills.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white">
                {heldBills.length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Held ({heldBills.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors ${activeTab === "history" ? "text-rose-500 font-bold" : "text-slate-400 font-medium"}`}
        >
          <History size={20} />
          <span className="text-[10px]">History</span>
        </button>

        <button 
          onClick={() => setActiveTab("editables")}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors ${activeTab === "editables" ? "text-rose-500 font-bold" : "text-slate-400 font-medium"}`}
        >
          <Settings size={20} />
          <span className="text-[10px]">Editables</span>
        </button>
      </nav>

    </div>
  );
}