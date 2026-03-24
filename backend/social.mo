import Types "types";
import Map "mo:map/Map";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";

module {

  public type SocialStore = {
    var friendRequests : Map.Map<Nat, Types.FriendRequest>;
    var nextId : Nat;
  };

  public func initStore() : SocialStore {
    { var friendRequests = Map.new<Nat, Types.FriendRequest>(); var nextId = 1 };
  };

  public func sendFriendRequest(store : SocialStore, from : Principal, to : Principal) : Nat {
    let id = store.nextId;
    store.nextId += 1;
    let req : Types.FriendRequest = {
      id; from; to;
      status = #pending;
      createdAt = Time.now();
    };
    Map.set(store.friendRequests, Map.nhash, id, req);
    id;
  };

  public func respondToRequest(store : SocialStore, caller : Principal, requestId : Nat, accept : Bool) : Bool {
    switch (Map.get(store.friendRequests, Map.nhash, requestId)) {
      case null { false };
      case (?req) {
        if (req.to != caller) { return false };
        let status : Types.FriendRequestStatus = if (accept) #accepted else #declined;
        Map.set(store.friendRequests, Map.nhash, requestId, { req with status });
        true;
      };
    };
  };

  public func getFriends(store : SocialStore, who : Principal) : [Principal] {
    let friends = Array.mapFilter<Types.FriendRequest, Principal>(
      Iter.toArray(Map.vals(store.friendRequests)),
      func(req) {
        if (req.status != #accepted) { return null };
        if (req.from == who) { ?req.to }
        else if (req.to == who) { ?req.from }
        else { null };
      }
    );
    friends;
  };

  public func getPendingRequests(store : SocialStore, who : Principal) : [Types.FriendRequest] {
    Array.filter<Types.FriendRequest>(
      Iter.toArray(Map.vals(store.friendRequests)),
      func(req) { req.to == who and req.status == #pending }
    );
  };
};
