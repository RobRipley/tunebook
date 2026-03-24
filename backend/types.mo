import Time "mo:base/Time";
import Principal "mo:base/Principal";

module {

  // ── Instruments ──

  public type Instrument = {
    #fiddle;
    #flute;
    #tinWhistle;
    #bodhran;
    #guitar;
    #banjo;
    #accordion;
    #concertina;
    #uilleannPipes;
    #harp;
    #mandolin;
    #bouzouki;
    #vocals;
    #other : Text;
  };

  // ── Location ──

  public type Location = {
    city : Text;
    country : Text;
  };

  // ── Users ──

  public type UserProfile = {
    displayName : Text;
    photo : ?Text;
    location : ?Location;
    instruments : [Instrument];
    bio : ?Text;
    createdAt : Time.Time;
  };

  public type StoredUserProfile = {
    principal : Principal;
    profile : UserProfile;
    knownTuneIds : [Nat];
    wishListTuneIds : [Nat];
  };

  // ── Tunes ──

  public type TuneType = {
    #reel;
    #jig;
    #hornpipe;
    #slipJig;
    #polka;
    #slide;
    #waltz;
    #mazurka;
    #barnDance;
    #other : Text;
  };

  public type Setting = {
    id : Nat;
    abcNotation : Text;
    submittedBy : Principal;
    starredBy : [Principal];
    playedBy : [Principal];
    createdAt : Time.Time;
    editedAt : ?Time.Time;
    previousAbcNotation : ?Text;
  };

  public type AlternateName = {
    name : Text;
    submittedBy : Principal;
    upvotedBy : [Principal];
    createdAt : Time.Time;
  };

  public type Tune = {
    id : Nat;
    title : Text;
    tuneType : TuneType;
    key : Text;
    settings : [Setting];
    alternateNames : [AlternateName];
    starredBy : [Principal];
    thesessionId : ?Nat;
    createdAt : Time.Time;
  };

  public type TuneCreateRequest = {
    title : Text;
    abcNotation : Text;
    tuneType : TuneType;
    key : Text;
  };

  public type TuneCreateResponse = {
    id : Nat;
    slug : Text;
  };

  // ── Sessions ──

  public type SessionFrequency = {
    #weekly;
    #biweekly;
    #monthly;
    #irregular;
  };

  public type DifficultyLevel = {
    #beginner;
    #intermediate;
    #advanced;
    #allLevels;
  };

  public type MusicSession = {
    id : Nat;
    name : Text;
    location : Location;
    time : Text;
    frequency : SessionFrequency;
    isOpen : Bool;
    difficulty : DifficultyLevel;
    description : Text;
    organizer : Principal;
    attendees : [Principal];
    starredBy : [Principal];
    createdAt : Time.Time;
  };

  // ── Setlists ──

  public type SetlistEntry = {
    tuneId : Nat;
    settingId : ?Nat;
  };

  public type Setlist = {
    id : Nat;
    name : Text;
    entries : [SetlistEntry];
    createdBy : Principal;
    upvotedBy : [Principal];
    sessionId : ?Nat;
    createdAt : Time.Time;
  };

  // ── Social ──

  public type FriendRequestStatus = {
    #pending;
    #accepted;
    #declined;
  };

  public type FriendRequest = {
    id : Nat;
    from : Principal;
    to : Principal;
    status : FriendRequestStatus;
    createdAt : Time.Time;
  };

  // Note: slug generation lives in tunes.mo, not here
};
