import Types "types";
import Map "mo:map/Map";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Char "mo:base/Char";
import Prim "mo:⛔";

module {

  public type TuneStore = {
    var tunes : Map.Map<Nat, Types.Tune>;
    var nextTuneId : Nat;
    var nextSettingId : Nat;
  };

  public func initStore() : TuneStore {
    {
      var tunes = Map.new<Nat, Types.Tune>();
      var nextTuneId = 1;
      var nextSettingId = 1;
    };
  };

  // ── Slug generation ──

  public func makeSlug(title : Text) : Text {
    var slug = "";
    for (c in title.chars()) {
      if (Char.isAlphabetic(c) or Char.isDigit(c)) {
        slug := slug # Char.toText(Prim.charToLower(c));
      } else if (c == ' ' or c == '-') {
        slug := slug # "-";
      };
    };
    slug;
  };

  // ── CRUD ──

  public func createTune(store : TuneStore, caller : Principal, req : Types.TuneCreateRequest) : Types.TuneCreateResponse {
    let tuneId = store.nextTuneId;
    let settingId = store.nextSettingId;
    store.nextTuneId += 1;
    store.nextSettingId += 1;

    let setting : Types.Setting = {
      id = settingId;
      abcNotation = req.abcNotation;
      submittedBy = caller;
      starredBy = [];
      playedBy = [];
      createdAt = Time.now();
      editedAt = null;
      previousAbcNotation = null;
    };

    let tune : Types.Tune = {
      id = tuneId;
      title = req.title;
      tuneType = req.tuneType;
      key = req.key;
      settings = [setting];
      alternateNames = [];
      starredBy = [];
      thesessionId = null;
      createdAt = Time.now();
    };

    Map.set(store.tunes, Map.nhash, tuneId, tune);
    { id = tuneId; slug = makeSlug(req.title) };
  };

  public func getTune(store : TuneStore, tuneId : Nat) : ?Types.Tune {
    Map.get(store.tunes, Map.nhash, tuneId);
  };

  public func listTunes(store : TuneStore) : [Types.Tune] {
    Iter.toArray(Map.vals(store.tunes));
  };

  // ── Settings ──

  public func addSetting(store : TuneStore, caller : Principal, tuneId : Nat, abcNotation : Text) : ?Nat {
    switch (Map.get(store.tunes, Map.nhash, tuneId)) {
      case null { null };
      case (?tune) {
        let settingId = store.nextSettingId;
        store.nextSettingId += 1;
        let setting : Types.Setting = {
          id = settingId;
          abcNotation;
          submittedBy = caller;
          starredBy = [];
          playedBy = [];
          createdAt = Time.now();
          editedAt = null;
          previousAbcNotation = null;
        };
        let updated = { tune with settings = Array.append(tune.settings, [setting]) };
        Map.set(store.tunes, Map.nhash, tuneId, updated);
        ?settingId;
      };
    };
  };

  // ── Star a tune (add to tunebook) ──

  public func starTune(store : TuneStore, caller : Principal, tuneId : Nat) : Bool {
    switch (Map.get(store.tunes, Map.nhash, tuneId)) {
      case null { false };
      case (?tune) {
        let alreadyStarred = Array.find<Principal>(tune.starredBy, func(p) { p == caller });
        switch (alreadyStarred) {
          case (?_) { true };
          case null {
            let updated = { tune with starredBy = Array.append(tune.starredBy, [caller]) };
            Map.set(store.tunes, Map.nhash, tuneId, updated);
            true;
          };
        };
      };
    };
  };

  public func unstarTune(store : TuneStore, caller : Principal, tuneId : Nat) : Bool {
    switch (Map.get(store.tunes, Map.nhash, tuneId)) {
      case null { false };
      case (?tune) {
        let updated = { tune with starredBy = Array.filter<Principal>(tune.starredBy, func(p) { p != caller }) };
        Map.set(store.tunes, Map.nhash, tuneId, updated);
        true;
      };
    };
  };

  // ── "I play this setting" ──

  public func markPlaySetting(store : TuneStore, caller : Principal, tuneId : Nat, settingId : Nat) : Bool {
    switch (Map.get(store.tunes, Map.nhash, tuneId)) {
      case null { false };
      case (?tune) {
        let updatedSettings = Array.map<Types.Setting, Types.Setting>(tune.settings, func(s) {
          if (s.id == settingId) {
            let alreadyPlaying = Array.find<Principal>(s.playedBy, func(p) { p == caller });
            switch (alreadyPlaying) {
              case (?_) { s };
              case null { { s with playedBy = Array.append(s.playedBy, [caller]) } };
            };
          } else {
            // Remove from other settings (one pick per tune)
            { s with playedBy = Array.filter<Principal>(s.playedBy, func(p) { p != caller }) };
          };
        });
        Map.set(store.tunes, Map.nhash, tuneId, { tune with settings = updatedSettings });
        true;
      };
    };
  };

  // ── Alternate Names ──

  public func addAlternateName(store : TuneStore, caller : Principal, tuneId : Nat, name : Text) : Bool {
    switch (Map.get(store.tunes, Map.nhash, tuneId)) {
      case null { false };
      case (?tune) {
        let alt : Types.AlternateName = {
          name;
          submittedBy = caller;
          upvotedBy = [];
          createdAt = Time.now();
        };
        let updated = { tune with alternateNames = Array.append(tune.alternateNames, [alt]) };
        Map.set(store.tunes, Map.nhash, tuneId, updated);
        true;
      };
    };
  };

  public func upvoteAlternateName(store : TuneStore, caller : Principal, tuneId : Nat, name : Text) : Bool {
    switch (Map.get(store.tunes, Map.nhash, tuneId)) {
      case null { false };
      case (?tune) {
        let updatedNames = Array.map<Types.AlternateName, Types.AlternateName>(tune.alternateNames, func(alt) {
          if (alt.name == name) {
            let already = Array.find<Principal>(alt.upvotedBy, func(p) { p == caller });
            switch (already) {
              case (?_) { alt };
              case null { { alt with upvotedBy = Array.append(alt.upvotedBy, [caller]) } };
            };
          } else { alt };
        });
        Map.set(store.tunes, Map.nhash, tuneId, { tune with alternateNames = updatedNames });
        true;
      };
    };
  };

  // ── Edit a setting ──

  public func editSetting(store : TuneStore, caller : Principal, tuneId : Nat, settingId : Nat, newAbc : Text) : Bool {
    switch (Map.get(store.tunes, Map.nhash, tuneId)) {
      case null { false };
      case (?tune) {
        let updatedSettings = Array.map<Types.Setting, Types.Setting>(tune.settings, func(s) {
          if (s.id == settingId and s.submittedBy == caller) {
            {
              s with
              abcNotation = newAbc;
              editedAt = ?Time.now();
              previousAbcNotation = ?s.abcNotation;
            };
          } else { s };
        });
        Map.set(store.tunes, Map.nhash, tuneId, { tune with settings = updatedSettings });
        true;
      };
    };
  };
};
