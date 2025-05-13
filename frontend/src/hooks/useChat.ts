import { useChatContext } from "@components/chat/ChatManager";

export function useChat() {
  const { openChat, closeChat, openChats } = useChatContext();

  const startPrivateChat = (userId: string) => openChat("private", userId);
  const startGroupChat = (groupId: string) => openChat("group", groupId);

  return {
    openChats,
    startPrivateChat,
    startGroupChat,
    closeChat,
  };
}
