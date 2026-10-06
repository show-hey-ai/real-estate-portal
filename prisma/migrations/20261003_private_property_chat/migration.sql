CREATE TABLE property_chat_sellers (
  "listingId" text PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  "sellerSubject" uuid NOT NULL,
  "assignedBy" uuid NOT NULL,
  "assignedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE property_chat_rooms (
  id uuid PRIMARY KEY,
  "listingId" text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  "buyerSubject" uuid NOT NULL,
  "sellerSubject" uuid NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CHECK ("buyerSubject" <> "sellerSubject"),
  UNIQUE ("listingId", "buyerSubject", "sellerSubject")
);
CREATE INDEX property_chat_buyer ON property_chat_rooms ("buyerSubject", "updatedAt" DESC);
CREATE INDEX property_chat_seller ON property_chat_rooms ("sellerSubject", "updatedAt" DESC);
CREATE TABLE property_chat_messages (
  id uuid PRIMARY KEY,
  "roomId" uuid NOT NULL REFERENCES property_chat_rooms(id) ON DELETE CASCADE,
  "senderSubject" uuid NOT NULL,
  "clientNonce" uuid NOT NULL,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
  language text NOT NULL CHECK (language IN ('ja','en','zh-CN','zh-TW')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("roomId", "senderSubject", "clientNonce")
);
CREATE INDEX property_chat_messages_room ON property_chat_messages ("roomId", "createdAt", id);
ALTER TABLE property_chat_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_chat_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON property_chat_sellers, property_chat_rooms, property_chat_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON property_chat_rooms, property_chat_messages TO authenticated;
CREATE POLICY property_chat_room_participant ON property_chat_rooms FOR SELECT TO authenticated
  USING (auth.uid() IN ("buyerSubject", "sellerSubject"));
CREATE POLICY property_chat_message_participant ON property_chat_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM property_chat_rooms r WHERE r.id = "roomId" AND auth.uid() IN (r."buyerSubject", r."sellerSubject")));
GRANT ALL ON property_chat_sellers, property_chat_rooms, property_chat_messages TO service_role;

-- Server writes still enforce room membership, deduplication and a shared rate limit.
CREATE FUNCTION property_chat_send(p_room uuid, p_sender uuid, p_nonce uuid, p_id uuid, p_body text, p_language text)
RETURNS SETOF property_chat_messages LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r property_chat_rooms; existing property_chat_messages;
BEGIN
  SELECT * INTO r FROM property_chat_rooms WHERE id = p_room FOR UPDATE;
  IF r.id IS NULL OR p_sender NOT IN (r."buyerSubject", r."sellerSubject") THEN
    RAISE EXCEPTION 'CHAT_NOT_FOUND';
  END IF;
  SELECT * INTO existing FROM property_chat_messages WHERE "roomId" = p_room AND "senderSubject" = p_sender AND "clientNonce" = p_nonce;
  IF existing.id IS NOT NULL THEN RETURN NEXT existing; RETURN; END IF;
  IF (SELECT count(*) FROM property_chat_messages WHERE "roomId" = p_room AND "senderSubject" = p_sender AND "createdAt" > now() - interval '1 minute') >= 20 THEN
    RAISE EXCEPTION 'CHAT_RATE_LIMIT';
  END IF;
  INSERT INTO property_chat_messages (id,"roomId","senderSubject","clientNonce",body,language)
    VALUES (p_id,p_room,p_sender,p_nonce,btrim(p_body),p_language) RETURNING * INTO existing;
  UPDATE property_chat_rooms SET "updatedAt" = now() WHERE id = p_room;
  RETURN NEXT existing;
END;
$$;
REVOKE ALL ON FUNCTION property_chat_send(uuid,uuid,uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION property_chat_send(uuid,uuid,uuid,uuid,text,text) TO service_role;
