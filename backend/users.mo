import Types "types";
import Map "mo:map/Map";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

module {

  public type UserStore = {
    var users : Map.Map<Principal, Types.StoredUserProfile>;
  };

  public func initStore() : UserStore {
    { var users = Map.new<Principal, Types.StoredUserProfile>() };
  };

  public func getProfile(store : UserStore, who : Principal) : ?Types.StoredUserProfile {
    Map.get(store.users, Map.phash, who);
  };

  public func saveProfile(store : UserStore, caller : Principal, profile : Types.UserProfile) : () {
    let existing = Map.get(store.users, Map.phash, caller);
    let stored : Types.StoredUserProfile = switch (existing) {
      case null {
        { principal = caller; profile; knownTuneIds = []; wishListTuneIds = [] };
      };
      case (?prev) {
        { prev with profile };
      };
    };
    Map.set(store.users, Map.phash, caller, stored);
  };

  public func addToTunebook(store : UserStore, caller : Principal, tuneId : Nat) : () {
    switch (Map.get(store.users, Map.phash, caller)) {
      case null {};
      case (?user) {
        let already = Array.find<Nat>(user.knownTuneIds, func(id) { id == tuneId });
        switch (already) {
          case (?_) {};
          case null {
            let updated = { user with knownTuneIds = Array.append(user.knownTuneIds, [tuneId]) };
            Map.set(store.users, Map.phash, caller, updated);
          };
        };
      };
    };
  };

  public func removeFromTunebook(store : UserStore, caller : Principal, tuneId : Nat) : () {
    switch (Map.get(store.users, Map.phash, caller)) {
      case null {};
      case (?user) {
        let updated = { user with knownTuneIds = Array.filter<Nat>(user.knownTuneIds, func(id) { id != tuneId }) };
        Map.set(store.users, Map.phash, caller, updated);
      };
    };
  };

  public func addToWishList(store : UserStore, caller : Principal, tuneId : Nat) : () {
    switch (Map.get(store.users, Map.phash, caller)) {
      case null {};
      case (?user) {
        let already = Array.find<Nat>(user.wishListTuneIds, func(id) { id == tuneId });
        switch (already) {
          case (?_) {};
          case null {
            let updated = { user with wishListTuneIds = Array.append(user.wishListTuneIds, [tuneId]) };
            Map.set(store.users, Map.phash, caller, updated);
          };
        };
      };
    };
  };

  public func removeFromWishList(store : UserStore, caller : Principal, tuneId : Nat) : () {
    switch (Map.get(store.users, Map.phash, caller)) {
      case null {};
      case (?user) {
        let updated = { user with wishListTuneIds = Array.filter<Nat>(user.wishListTuneIds, func(id) { id != tuneId }) };
        Map.set(store.users, Map.phash, caller, updated);
      };
    };
  };

  public func listUsers(store : UserStore) : [Types.StoredUserProfile] {
    Iter.toArray(Map.vals(store.users));
  };
};
