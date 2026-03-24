import Types "types";
import Tunes "tunes";
import Users "users";
import Sessions "sessions";
import Setlists "setlists";
import Social "social";
import TheSession "thesession";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Map "mo:map/Map";

actor Tunebook {

  // ── Stable State ──
  // Using mo:map which is stable-compatible (unlike HashMap from mo:base)

  stable var tuneStore = Tunes.initStore();
  stable var userStore = Users.initStore();
  stable var sessionStore = Sessions.initStore();
  stable var setlistStore = Setlists.initStore();
  stable var socialStore = Social.initStore();

  // ── Auth guard ──

  func requireAuth(caller : Principal) {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Authentication required");
    };
  };

  // ── User Profile ──

  public query ({ caller }) func getMyProfile() : async ?Types.StoredUserProfile {
    Users.getProfile(userStore, caller);
  };

  public query func getUserProfile(who : Principal) : async ?Types.StoredUserProfile {
    Users.getProfile(userStore, who);
  };

  public shared ({ caller }) func saveMyProfile(profile : Types.UserProfile) : async () {
    requireAuth(caller);
    Users.saveProfile(userStore, caller, profile);
  };

  // ── Tunes ──

  public shared ({ caller }) func createTune(req : Types.TuneCreateRequest) : async Types.TuneCreateResponse {
    requireAuth(caller);
    Tunes.createTune(tuneStore, caller, req);
  };

  public query func getTune(tuneId : Nat) : async ?Types.Tune {
    Tunes.getTune(tuneStore, tuneId);
  };

  public query func listTunes() : async [Types.Tune] {
    Tunes.listTunes(tuneStore);
  };

  public shared ({ caller }) func addSetting(tuneId : Nat, abcNotation : Text) : async ?Nat {
    requireAuth(caller);
    Tunes.addSetting(tuneStore, caller, tuneId, abcNotation);
  };

  public shared ({ caller }) func editSetting(tuneId : Nat, settingId : Nat, newAbc : Text) : async Bool {
    requireAuth(caller);
    Tunes.editSetting(tuneStore, caller, tuneId, settingId, newAbc);
  };

  public shared ({ caller }) func starTune(tuneId : Nat) : async Bool {
    requireAuth(caller);
    Users.addToTunebook(userStore, caller, tuneId);
    Tunes.starTune(tuneStore, caller, tuneId);
  };

  public shared ({ caller }) func unstarTune(tuneId : Nat) : async Bool {
    requireAuth(caller);
    Users.removeFromTunebook(userStore, caller, tuneId);
    Tunes.unstarTune(tuneStore, caller, tuneId);
  };

  public shared ({ caller }) func markPlaySetting(tuneId : Nat, settingId : Nat) : async Bool {
    requireAuth(caller);
    // Auto-star when marking a setting
    ignore Tunes.starTune(tuneStore, caller, tuneId);
    Users.addToTunebook(userStore, caller, tuneId);
    Tunes.markPlaySetting(tuneStore, caller, tuneId, settingId);
  };

  public shared ({ caller }) func addAlternateName(tuneId : Nat, name : Text) : async Bool {
    requireAuth(caller);
    Tunes.addAlternateName(tuneStore, caller, tuneId, name);
  };

  public shared ({ caller }) func upvoteAlternateName(tuneId : Nat, name : Text) : async Bool {
    requireAuth(caller);
    Tunes.upvoteAlternateName(tuneStore, caller, tuneId, name);
  };

  public shared ({ caller }) func addToWishList(tuneId : Nat) : async () {
    requireAuth(caller);
    Users.addToWishList(userStore, caller, tuneId);
  };

  public shared ({ caller }) func removeFromWishList(tuneId : Nat) : async () {
    requireAuth(caller);
    Users.removeFromWishList(userStore, caller, tuneId);
  };

  // ── Computed queries ──

  public query ({ caller }) func getTunesInCommon(other : Principal) : async [Nat] {
    let myProfile = Users.getProfile(userStore, caller);
    let theirProfile = Users.getProfile(userStore, other);
    switch (myProfile, theirProfile) {
      case (?me, ?them) {
        Array.filter<Nat>(me.knownTuneIds, func(id) {
          Array.find<Nat>(them.knownTuneIds, func(tid) { tid == id }) != null;
        });
      };
      case _ { [] };
    };
  };

  public query ({ caller }) func getFriendsWhoKnowTune(tuneId : Nat) : async [Principal] {
    let friends = Social.getFriends(socialStore, caller);
    Array.filter<Principal>(friends, func(f) {
      switch (Users.getProfile(userStore, f)) {
        case null { false };
        case (?profile) {
          Array.find<Nat>(profile.knownTuneIds, func(id) { id == tuneId }) != null;
        };
      };
    });
  };

  public query ({ caller }) func getTopFriendTunes() : async [Nat] {
    let friends = Social.getFriends(socialStore, caller);
    let allTuneIds = Array.flatten<Nat>(
      Array.map<Principal, [Nat]>(friends, func(f) {
        switch (Users.getProfile(userStore, f)) {
          case null { [] };
          case (?profile) { profile.knownTuneIds };
        };
      })
    );
    allTuneIds;
  };

  public query func listSetlistsByUser(who : Principal) : async [Types.Setlist] {
    Setlists.listSetlistsByUser(setlistStore, who);
  };

  public query func listSetlistsBySession(sessionId : Nat) : async [Types.Setlist] {
    Setlists.listSetlistsBySession(setlistStore, sessionId);
  };

  // ── Sessions ──

  public shared ({ caller }) func createSession(
    name : Text, location : Types.Location, time : Text,
    frequency : Types.SessionFrequency, isOpen : Bool,
    difficulty : Types.DifficultyLevel, description : Text
  ) : async Nat {
    requireAuth(caller);
    Sessions.createSession(sessionStore, caller, name, location, time, frequency, isOpen, difficulty, description);
  };

  public query func getSession(id : Nat) : async ?Types.MusicSession {
    Sessions.getSession(sessionStore, id);
  };

  public query func listSessions() : async [Types.MusicSession] {
    Sessions.listSessions(sessionStore);
  };

  public shared ({ caller }) func joinSession(id : Nat) : async Bool {
    requireAuth(caller);
    Sessions.joinSession(sessionStore, caller, id);
  };

  public shared ({ caller }) func starSession(id : Nat) : async Bool {
    requireAuth(caller);
    Sessions.starSession(sessionStore, caller, id);
  };

  // ── Setlists ──

  public shared ({ caller }) func createSetlist(name : Text, entries : [Types.SetlistEntry], sessionId : ?Nat) : async Nat {
    requireAuth(caller);
    Setlists.createSetlist(setlistStore, caller, name, entries, sessionId);
  };

  public query func getSetlist(id : Nat) : async ?Types.Setlist {
    Setlists.getSetlist(setlistStore, id);
  };

  public query func listSetlists() : async [Types.Setlist] {
    Setlists.listSetlists(setlistStore);
  };

  public shared ({ caller }) func upvoteSetlist(id : Nat) : async Bool {
    requireAuth(caller);
    Setlists.upvoteSetlist(setlistStore, caller, id);
  };

  // ── Social ──

  public shared ({ caller }) func sendFriendRequest(to : Principal) : async Nat {
    requireAuth(caller);
    Social.sendFriendRequest(socialStore, caller, to);
  };

  public shared ({ caller }) func respondToFriendRequest(requestId : Nat, accept : Bool) : async Bool {
    requireAuth(caller);
    Social.respondToRequest(socialStore, caller, requestId, accept);
  };

  public query ({ caller }) func getMyFriends() : async [Principal] {
    Social.getFriends(socialStore, caller);
  };

  public query ({ caller }) func getMyPendingRequests() : async [Types.FriendRequest] {
    Social.getPendingRequests(socialStore, caller);
  };

  // ── TheSession.org ──

  public query func transform(input : { response : TheSession.HttpResponse; context : Blob }) : async TheSession.HttpResponse {
    TheSession.transform(input);
  };

  public shared func searchThesessionTunes(searchQuery : Text, tuneType : ?Text, page : Nat) : async Text {
    await TheSession.searchTunes(searchQuery, tuneType, page, transform);
  };

  public shared func fetchThesessionTune(tuneId : Nat) : async Text {
    await TheSession.fetchTune(tuneId, transform);
  };

  public shared ({ caller }) func importThesessionTune(
    thesessionId : Nat,
    title : Text,
    abcNotation : Text,
    tuneType : Types.TuneType,
    key : Text
  ) : async Types.TuneCreateResponse {
    requireAuth(caller);
    let result = Tunes.createTune(tuneStore, caller, {
      title; abcNotation; tuneType; key;
    });
    // Persist the thesession.org origin ID on the tune
    switch (Tunes.getTune(tuneStore, result.id)) {
      case null {};
      case (?tune) {
        let updated = { tune with thesessionId = ?thesessionId };
        Map.set(tuneStore.tunes, Map.nhash, result.id, updated);
      };
    };
    ignore Tunes.starTune(tuneStore, caller, result.id);
    Users.addToTunebook(userStore, caller, result.id);
    result;
  };
};
