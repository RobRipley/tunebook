import Types "types";
import Map "mo:map/Map";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";

module {

  public type SessionStore = {
    var sessions : Map.Map<Nat, Types.MusicSession>;
    var nextId : Nat;
  };

  public func initStore() : SessionStore {
    { var sessions = Map.new<Nat, Types.MusicSession>(); var nextId = 1 };
  };

  public func createSession(
    store : SessionStore,
    caller : Principal,
    name : Text,
    location : Types.Location,
    time : Text,
    frequency : Types.SessionFrequency,
    isOpen : Bool,
    difficulty : Types.DifficultyLevel,
    description : Text
  ) : Nat {
    let id = store.nextId;
    store.nextId += 1;
    let session : Types.MusicSession = {
      id; name; location; time; frequency; isOpen;
      difficulty; description;
      organizer = caller;
      attendees = [caller];
      starredBy = [];
      createdAt = Time.now();
    };
    Map.set(store.sessions, Map.nhash, id, session);
    id;
  };

  public func getSession(store : SessionStore, id : Nat) : ?Types.MusicSession {
    Map.get(store.sessions, Map.nhash, id);
  };

  public func listSessions(store : SessionStore) : [Types.MusicSession] {
    Iter.toArray(Map.vals(store.sessions));
  };

  public func joinSession(store : SessionStore, caller : Principal, id : Nat) : Bool {
    switch (Map.get(store.sessions, Map.nhash, id)) {
      case null { false };
      case (?s) {
        let already = Array.find<Principal>(s.attendees, func(p) { p == caller });
        switch (already) {
          case (?_) { true };
          case null {
            Map.set(store.sessions, Map.nhash, id, { s with attendees = Array.append(s.attendees, [caller]) });
            true;
          };
        };
      };
    };
  };

  public func starSession(store : SessionStore, caller : Principal, id : Nat) : Bool {
    switch (Map.get(store.sessions, Map.nhash, id)) {
      case null { false };
      case (?s) {
        let already = Array.find<Principal>(s.starredBy, func(p) { p == caller });
        switch (already) {
          case (?_) { true };
          case null {
            Map.set(store.sessions, Map.nhash, id, { s with starredBy = Array.append(s.starredBy, [caller]) });
            true;
          };
        };
      };
    };
  };
};
