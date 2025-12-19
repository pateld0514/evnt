import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
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
      setIsVendor(user.user_type === "vendor");
      
      if (user.user_type === "vendor" && user.vendor_id) {
        const vendorList = await base44.entities.Vendor.filter({ id: user.vendor_id });
        if (vendorList && vendorList.length > 0) {
          setVendorData(vendorList[0]);
        }
      }
    };
    loadUser();
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date'),
    initialData: [],
    refetchInterval: 3000,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
    initialData: [],
  });

  const { data: savedVendors = [] } = useQuery({
    queryKey: ['saved-vendors'],
    queryFn: () => base44.entities.SavedVendor.list(),
    initialData: [],
    enabled: !isVendor,
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
    initialData: [],
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      setMessageText("");
      toast.success("Message sent!");
    },
  });

  useEffect(() => {
    if (vendorIdFromUrl && vendors.length > 0 && currentUser) {
      const vendor = vendors.find(v => v.id === vendorIdFromUrl);
      if (vendor) {
        const existingConvo = conversations.find(c => c.vendorId === vendorIdFromUrl);
        if (existingConvo) {
          setSelectedConversation(existingConvo);
        } else {
          setSelectedConversation({
            id: `${currentUser.email}-${vendorIdFromUrl}`,
            vendorId: vendorIdFromUrl,
            vendorName: vendor.business_name,
            clientEmail: currentUser.email,
            clientName: currentUser.full_name,
            otherPartyEmail: vendor.contact_email,
            otherPartyName: vendor.business_name,
          });
        }
      }
    }
  }, [vendorIdFromUrl, vendors, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversation]);

  // Group messages by conversation and get latest message info
  const conversations = messages.reduce((acc, msg) => {
    const convId = msg.conversation_id;
    if (!acc.find(c => c.id === convId)) {
      const isFromMe = msg.sender_email === currentUser?.email;
      const otherEmail = isFromMe ? msg.recipient_email : msg.sender_email;
      const otherName = isFromMe ? 
        (isVendor ? msg.sender_name : msg.vendor_name) : 
        msg.sender_name;

      // Count unread messages
      const unreadCount = messages.filter(m => 
        m.conversation_id === convId && 
        !m.read && 
        m.recipient_email === currentUser?.email
      ).length;

      acc.push({
        id: convId,
        vendorId: msg.vendor_id,
        vendorName: msg.vendor_name,
        clientEmail: isVendor ? otherEmail : msg.sender_email,
        clientName: isVendor ? otherName : msg.sender_name,
        otherPartyEmail: otherEmail,
        otherPartyName: otherName,
        lastMessage: msg.message,
        lastMessageTime: msg.created_date,
        lastSender: msg.sender_name,
        unreadCount: unreadCount,
      });
    }
    return acc;
  }, []);

  const currentMessages = messages.filter(
    msg => msg.conversation_id === selectedConversation?.id
  ).reverse();

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (selectedConversation && currentUser) {
      const unreadMessages = currentMessages.filter(m => 
        !m.read && m.recipient_email === currentUser.email
      );
      
      unreadMessages.forEach(msg => {
        base44.entities.Message.update(msg.id, { read: true });
      });
      
      if (unreadMessages.length > 0) {
        queryClient.invalidateQueries(['messages']);
      }
    }
  }, [selectedConversation, currentUser]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation || !currentUser) return;

    sendMessageMutation.mutate({
      conversation_id: selectedConversation.id,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      recipient_email: selectedConversation.otherPartyEmail,
      vendor_id: selectedConversation.vendorId,
      vendor_name: selectedConversation.vendorName,
      message: messageText,
      read: false,
    });
  };

  const getComposeOptions = () => {
    if (isVendor) {
      const uniqueClients = bookings.reduce((acc, booking) => {
        const existingConvo = conversations.find(c => 
          c.clientEmail === booking.client_email
        );
        if (!existingConvo && !acc.find(c => c.email === booking.client_email)) {
          acc.push({
            name: booking.client_name,
            email: booking.client_email,
            vendorId: vendorData?.id,
            vendorName: vendorData?.business_name,
          });
        }
        return acc;
      }, []);
      return uniqueClients;
    } else {
      const options = [];
      
      savedVendors.forEach(saved => {
        const vendor = vendors.find(v => v.id === saved.vendor_id);
        if (vendor) {
          const existingConvo = conversations.find(c => c.vendorId === vendor.id);
          if (!existingConvo && !options.find(o => o.vendorId === vendor.id)) {
            options.push({
              name: vendor.business_name,
              email: vendor.contact_email,
              vendorId: vendor.id,
              vendorName: vendor.business_name,
            });
          }
        }
      });
      
      bookings.forEach(booking => {
        const existingConvo = conversations.find(c => c.vendorId === booking.vendor_id);
        if (!existingConvo && !options.find(o => o.vendorId === booking.vendor_id)) {
          options.push({
            name: booking.vendor_name,
            email: booking.vendor_id,
            vendorId: booking.vendor_id,
            vendorName: booking.vendor_name,
          });
        }
      });
      
      return options;
    }
  };

  const handleStartConversation = (option) => {
    const convId = isVendor 
      ? `${vendorData.id}-${option.email}`
      : `${currentUser.email}-${option.vendorId}`;
    
    setSelectedConversation({
      id: convId,
      vendorId: isVendor ? vendorData.id : option.vendorId,
      vendorName: isVendor ? vendorData.business_name : option.vendorName,
      clientEmail: isVendor ? option.email : currentUser.email,
      clientName: isVendor ? option.name : currentUser.full_name,
      otherPartyEmail: isVendor ? option.email : option.email,
      otherPartyName: option.name,
    });
    setComposeOpen(false);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="h-[calc(100vh-8rem)] max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid md:grid-cols-3 gap-6 h-full">
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
            <div className="divide-y-2 divide-gray-200">
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
                      <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {convo.otherPartyName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-bold text-black truncate ${convo.unreadCount > 0 ? 'font-black' : ''}`}>
                            {convo.otherPartyName}
                          </h3>
                          {convo.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white ml-2 flex-shrink-0">{convo.unreadCount}</Badge>
                          )}
                        </div>
                        <p className={`text-sm text-gray-600 truncate ${convo.unreadCount > 0 ? 'font-bold' : ''}`}>
                          {convo.lastSender}: {convo.lastMessage}
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
              <CardHeader className="bg-black text-white flex-row items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-gray-800 md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <CardTitle className="font-black">{selectedConversation.otherPartyName}</CardTitle>
                  <p className="text-sm text-gray-300">{selectedConversation.otherPartyEmail}</p>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.map((msg) => {
                  const isMe = msg.sender_email === currentUser.email;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMe
                            ? "bg-black text-white"
                            : "bg-gray-100 text-black border-2 border-gray-300"
                        }`}
                      >
                        {!isMe && (
                          <p className="text-xs font-bold mb-1 opacity-70">{msg.sender_name}</p>
                        )}
                        <p className="font-medium">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 border-t-2 border-black">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="border-2 border-gray-300 focus:border-black"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="bg-black text-white hover:bg-gray-800 font-bold"
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
          <div className="space-y-2">
            {getComposeOptions().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="font-medium">No contacts available</p>
                <p className="text-sm mt-2">
                  {isVendor 
                    ? "You'll see clients here when they book your services"
                    : "Save vendors or make a booking to start messaging"}
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
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-bold">
                      {option.name[0]}
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