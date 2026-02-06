import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Plus, Store, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MessagesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [vendorData, setVendorData] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const vendorIdFromUrl = urlParams.get('vendor');

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const userIsVendor = user.user_type === "vendor" || user.demo_mode === "vendor";
      setIsVendor(userIsVendor);
      
      if (userIsVendor && user.vendor_id) {
        const vendorList = await base44.entities.Vendor.filter({ id: user.vendor_id });
        if (vendorList && vendorList.length > 0) {
          setVendorData(vendorList[0]);
        }
      }
    };
    loadUser();
  }, []);

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      const messages = await base44.entities.Message.list('-created_date');
      return messages.filter(m => 
        m.sender_email === currentUser.email || 
        m.recipient_email === currentUser.email
      );
    },
    enabled: !!currentUser,
    refetchInterval: selectedConversation ? 10000 : false,
    staleTime: 30 * 1000,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-for-messages'],
    queryFn: async () => {
      if (!currentUser) return [];
      if (isVendor && vendorData) {
        return await base44.entities.Booking.filter({ vendor_id: vendorData.id });
      } else {
        return await base44.entities.Booking.filter({ client_email: currentUser.email });
      }
    },
    enabled: !!currentUser && (isVendor ? !!vendorData : true),
    staleTime: 2 * 60 * 1000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      // Verify the sender is the current user
      if (messageData.sender_email !== currentUser.email) {
        throw new Error("Unauthorized: You can only send messages as yourself");
      }
      return await base44.entities.Message.create(messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      setMessageText("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  // Generate conversation ID consistently
  const getConversationId = (vendorId, clientEmail) => {
    return `${vendorId}__${clientEmail}`;
  };

  // Build conversations from messages
  const conversations = React.useMemo(() => {
    const conversationMap = new Map();

    allMessages.forEach(msg => {
      const convId = msg.conversation_id;
      
      if (!conversationMap.has(convId)) {
        const parts = convId.split('__');
        const vendorId = parts[0];
        const clientEmail = parts[1];
        const vendor = vendors.find(v => v.id === vendorId);
        
        const isFromMe = msg.sender_email === currentUser.email;
        const otherPartyEmail = isFromMe ? msg.recipient_email : msg.sender_email;
        const otherPartyName = isFromMe 
          ? (isVendor ? msg.recipient_email.split('@')[0] : vendor?.business_name || 'Unknown')
          : msg.sender_name;

        conversationMap.set(convId, {
          id: convId,
          vendorId: vendorId,
          vendorName: vendor?.business_name || 'Unknown Vendor',
          clientEmail: clientEmail,
          otherPartyEmail: otherPartyEmail,
          otherPartyName: otherPartyName,
          isVendorConvo: isVendor,
          lastMessage: msg.message,
          lastMessageTime: msg.created_date,
          lastSender: msg.sender_name,
          unreadCount: 0,
        });
      }
    });

    // Calculate unread counts
    conversationMap.forEach((convo, convId) => {
      const unread = allMessages.filter(m => 
        m.conversation_id === convId && 
        !m.read && 
        m.recipient_email === currentUser.email
      ).length;
      convo.unreadCount = unread;
    });

    return Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
  }, [allMessages, currentUser, vendors, isVendor]);

  // Handle URL vendor parameter
  useEffect(() => {
    if (vendorIdFromUrl && vendors.length > 0 && currentUser) {
      const vendor = vendors.find(v => v.id === vendorIdFromUrl);
      if (vendor) {
        const convId = getConversationId(vendorIdFromUrl, currentUser.email);
        const existingConvo = conversations.find(c => c.id === convId);
        
        if (existingConvo) {
          setSelectedConversation(existingConvo);
        } else {
          setSelectedConversation({
            id: convId,
            vendorId: vendorIdFromUrl,
            vendorName: vendor.business_name,
            clientEmail: currentUser.email,
            otherPartyEmail: vendor.contact_email || vendor.created_by,
            otherPartyName: vendor.business_name,
            isVendorConvo: false,
          });
        }
      }
    }
  }, [vendorIdFromUrl, vendors, currentUser, conversations]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, selectedConversation]);

  // Mark messages as read
  useEffect(() => {
    if (selectedConversation && currentUser) {
      const unreadMessages = allMessages.filter(m => 
        m.conversation_id === selectedConversation.id &&
        !m.read && 
        m.recipient_email === currentUser.email
      );
      
      unreadMessages.forEach(msg => {
        base44.entities.Message.update(msg.id, { read: true });
      });
      
      if (unreadMessages.length > 0) {
        setTimeout(() => queryClient.invalidateQueries(['messages']), 500);
      }
    }
  }, [selectedConversation?.id, currentUser, allMessages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation || !currentUser) return;

    const messageData = {
      conversation_id: selectedConversation.id,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      recipient_email: selectedConversation.otherPartyEmail,
      vendor_id: selectedConversation.vendorId,
      vendor_name: selectedConversation.vendorName,
      message: messageText.trim(),
      read: false,
    };

    sendMessageMutation.mutate(messageData);
  };

  const getComposeOptions = () => {
    if (isVendor && vendorData) {
      // Vendors can message clients from bookings
      const clientEmails = [...new Set(bookings.map(b => b.client_email))];
      return clientEmails
        .filter(email => !conversations.find(c => c.clientEmail === email))
        .map(email => {
          const booking = bookings.find(b => b.client_email === email);
          return {
            name: booking?.client_name || email.split('@')[0],
            email: email,
            type: 'client',
          };
        });
    } else {
      // Clients can message approved vendors
      return vendors
        .filter(v => v.approval_status === "approved")
        .filter(v => !conversations.find(c => c.vendorId === v.id))
        .map(v => ({
          name: v.business_name,
          email: v.contact_email || v.created_by,
          vendorId: v.id,
          type: 'vendor',
        }));
    }
  };

  const handleStartConversation = (option) => {
    if (isVendor && vendorData) {
      const convId = getConversationId(vendorData.id, option.email);
      setSelectedConversation({
        id: convId,
        vendorId: vendorData.id,
        vendorName: vendorData.business_name,
        clientEmail: option.email,
        otherPartyEmail: option.email,
        otherPartyName: option.name,
        isVendorConvo: true,
      });
    } else {
      const convId = getConversationId(option.vendorId, currentUser.email);
      setSelectedConversation({
        id: convId,
        vendorId: option.vendorId,
        vendorName: option.name,
        clientEmail: currentUser.email,
        otherPartyEmail: option.email,
        otherPartyName: option.name,
        isVendorConvo: false,
      });
    }
    setComposeOpen(false);
  };

  const currentMessages = allMessages
    .filter(msg => msg.conversation_id === selectedConversation?.id)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="h-[calc(100vh-8rem)] max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid md:grid-cols-3 gap-4 md:gap-6 h-full">
        {/* Conversations List */}
        <Card className="border-2 border-black overflow-hidden">
          <CardHeader className="bg-black text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="font-black">Messages</CardTitle>
                {totalUnread > 0 && (
                  <Badge className="bg-red-500 text-white">{totalUnread}</Badge>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-gray-800"
                onClick={() => setComposeOpen(true)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y-2 divide-gray-200 max-h-[calc(100vh-14rem)] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm mt-2">Start connecting with {isVendor ? 'clients' : 'vendors'}!</p>
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConversation(convo)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === convo.id ? "bg-gray-100" : ""
                    } ${convo.unreadCount > 0 ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                        isVendor ? 'bg-blue-600' : 'bg-purple-600'
                      }`}>
                        {isVendor ? <UserIcon className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h3 className={`font-bold text-black truncate ${convo.unreadCount > 0 ? 'font-black' : ''}`}>
                              {convo.otherPartyName}
                            </h3>
                            <Badge variant="outline" className={`text-xs flex-shrink-0 font-bold ${
                              isVendor ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-purple-50 text-purple-700 border-purple-300'
                            }`}>
                              {isVendor ? 'Client' : 'Vendor'}
                            </Badge>
                          </div>
                          {convo.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white ml-2 flex-shrink-0">{convo.unreadCount}</Badge>
                          )}
                        </div>
                        <p className={`text-sm text-gray-600 truncate ${convo.unreadCount > 0 ? 'font-bold' : ''}`}>
                          {convo.lastMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 border-2 border-black flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="bg-black text-white">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isVendor ? 'bg-blue-600' : 'bg-purple-600'
                  }`}>
                    {isVendor ? <UserIcon className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="font-black">{selectedConversation.otherPartyName}</CardTitle>
                      <Badge className={`text-xs font-bold ${
                        isVendor ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        {isVendor ? 'Client' : 'Vendor'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300">{selectedConversation.otherPartyEmail}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  currentMessages.map((msg) => {
                    const isMe = msg.sender_email === currentUser.email;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                         className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                           isMe
                             ? "bg-black text-white"
                             : "bg-gray-100 text-black border-2 border-gray-300"
                         }`}
                        >
                         {!isMe && (
                           <p className="text-xs font-bold mb-1.5 opacity-70">{msg.sender_name}</p>
                         )}
                         <p className="text-base font-medium break-words leading-relaxed">{msg.message}</p>
                         <p className={`text-xs mt-1.5 ${isMe ? 'text-gray-400' : 'text-gray-500'}`}>
                           {format(new Date(msg.created_date), 'h:mm a')}
                         </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 border-t-2 border-black">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="border-2 border-gray-300 focus:border-black text-base h-12"
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="bg-black text-white hover:bg-gray-800 font-bold h-12 px-6"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-black">
                  <Send className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-black text-black mb-2">
                  Select a Conversation
                </h3>
                <p className="text-gray-600">
                  Choose a {isVendor ? 'client' : 'vendor'} to start messaging
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-md border-4 border-black">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getComposeOptions().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="font-medium">No contacts available</p>
                <p className="text-sm mt-2">
                  {isVendor 
                    ? "You'll see clients here when they book your services"
                    : "Browse vendors to start messaging"}
                </p>
              </div>
            ) : (
              getComposeOptions().map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStartConversation(option)}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-black transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      option.type === 'vendor' ? 'bg-purple-600' : 'bg-blue-600'
                    }`}>
                      {option.type === 'vendor' ? <Store className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black">{option.name}</h3>
                      <p className="text-sm text-gray-500">{option.email}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}