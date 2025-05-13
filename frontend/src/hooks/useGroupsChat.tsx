"use client";
import { useEffect, useState } from "react";
import { Group } from "@/types/group";
import axios from "axios";

export function useGroupsChat() {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    axios.get("/api/groups", { withCredentials: true })
      .then((res) => {
        const data = res.data;
        setGroups(data || []);
      })
      .catch(() => {
        setGroups([]);
      });
  }, []);

  return groups;
}
