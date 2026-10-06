CREATE TABLE property_chat_operator (
  id text PRIMARY KEY CHECK (id = 'default'),
  subject uuid NOT NULL,
  "configuredAt" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE property_chat_operator ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON property_chat_operator FROM PUBLIC, anon, authenticated;
GRANT ALL ON property_chat_operator TO service_role;
ALTER TABLE property_chat_rooms ADD COLUMN "sellerKind" text NOT NULL DEFAULT 'seller' CHECK ("sellerKind" IN ('seller','manager'));
ALTER TABLE property_chat_rooms ADD COLUMN stage text NOT NULL DEFAULT 'consultation' CHECK (stage IN ('consultation','viewing','offer','contract','settlement','completed','cancelled'));
ALTER TABLE property_chat_messages ADD COLUMN kind text NOT NULL DEFAULT 'text' CHECK (kind IN ('text','viewing','offer','stage'));
ALTER TABLE property_chat_messages ADD COLUMN details jsonb NOT NULL DEFAULT '{}';

CREATE FUNCTION property_chat_trade_send(p_room uuid,p_sender uuid,p_nonce uuid,p_id uuid,p_body text,p_language text,p_kind text,p_details jsonb,p_stage text)
RETURNS SETOF property_chat_messages LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r property_chat_rooms; m property_chat_messages;
BEGIN
  SELECT * INTO r FROM property_chat_rooms WHERE id=p_room FOR UPDATE;
  IF r.id IS NULL OR p_sender NOT IN (r."buyerSubject",r."sellerSubject") THEN RAISE EXCEPTION 'CHAT_NOT_FOUND'; END IF;
  IF p_stage IS NOT NULL AND (p_sender<>r."sellerSubject" OR p_kind<>'stage') THEN RAISE EXCEPTION 'CHAT_NOT_FOUND'; END IF;
  IF p_kind='stage' AND p_stage IS NULL THEN RAISE EXCEPTION 'CHAT_INVALID_ACTION'; END IF;
  IF p_kind IN ('viewing','offer') AND p_sender<>r."buyerSubject" THEN RAISE EXCEPTION 'CHAT_INVALID_ACTION'; END IF;
  SELECT * INTO m FROM property_chat_messages WHERE "roomId"=p_room AND "senderSubject"=p_sender AND "clientNonce"=p_nonce;
  IF m.id IS NOT NULL THEN RETURN NEXT m; RETURN; END IF;
  SELECT * INTO m FROM property_chat_send(p_room,p_sender,p_nonce,p_id,p_body,p_language);
  UPDATE property_chat_messages SET kind=p_kind,details=p_details WHERE id=m.id RETURNING * INTO m;
  IF p_stage IS NOT NULL THEN UPDATE property_chat_rooms SET stage=p_stage WHERE id=p_room;
  ELSIF p_kind='viewing' AND r.stage='consultation' THEN UPDATE property_chat_rooms SET stage='viewing' WHERE id=p_room;
  ELSIF p_kind='offer' AND r.stage IN ('consultation','viewing') THEN UPDATE property_chat_rooms SET stage='offer' WHERE id=p_room;
  END IF;
  RETURN NEXT m;
END;
$$;
REVOKE ALL ON FUNCTION property_chat_trade_send(uuid,uuid,uuid,uuid,text,text,text,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION property_chat_trade_send(uuid,uuid,uuid,uuid,text,text,text,jsonb,text) TO service_role;
