import Types "types";
import Map "mo:map/Map";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";

module {

  public type SetlistStore = {
    var setlists : Map.Map<Nat, Types.Setlist>;
    var nextId : Nat;
  };

  public func initStore() : SetlistStore {
    { var setlists = Map.new<Nat, Types.Setlist>(); var nextId = 1 };
  };

  public func createSetlist(
    store : SetlistStore,
    caller : Principal,
    name : Text,
    entries : [Types.SetlistEntry],
    sessionId : ?Nat
  ) : Nat {
    let id = store.nextId;
    store.nextId += 1;
    let setlist : Types.Setlist = {
      id; name; entries;
      createdBy = caller;
      upvotedBy = [];
      sessionId;
      createdAt = Time.now();
    };
    Map.set(store.setlists, Map.nhash, id, setlist);
    id;
  };

  public func getSetlist(store : SetlistStore, id : Nat) : ?Types.Setlist {
    Map.get(store.setlists, Map.nhash, id);
  };

  public func listSetlists(store : SetlistStore) : [Types.Setlist] {
    Iter.toArray(Map.vals(store.setlists));
  };

  public func listSetlistsByUser(store : SetlistStore, who : Principal) : [Types.Setlist] {
    Array.filter<Types.Setlist>(
      Iter.toArray(Map.vals(store.setlists)),
      func(s) { s.createdBy == who }
    );
  };

  public func listSetlistsBySession(store : SetlistStore, sessionId : Nat) : [Types.Setlist] {
    Array.filter<Types.Setlist>(
      Iter.toArray(Map.vals(store.setlists)),
      func(s) {
        switch (s.sessionId) {
          case null { false };
          case (?sid) { sid == sessionId };
        };
      }
    );
  };

  public func upvoteSetlist(store : SetlistStore, caller : Principal, id : Nat) : Bool {
    switch (Map.get(store.setlists, Map.nhash, id)) {
      case null { false };
      case (?s) {
        let already = Array.find<Principal>(s.upvotedBy, func(p) { p == caller });
        switch (already) {
          case (?_) { true };
          case null {
            Map.set(store.setlists, Map.nhash, id, { s with upvotedBy = Array.append(s.upvotedBy, [caller]) });
            true;
          };
        };
      };
    };
  };
};
