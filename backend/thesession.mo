import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";

module {

  public type IC = actor {
    http_request : shared {
      url : Text;
      max_response_bytes : ?Nat64;
      method : { #get; #head; #post };
      headers : [{ name : Text; value : Text }];
      body : ?Blob;
      transform : ?{
        function : shared query ({ response : HttpResponse; context : Blob }) -> async HttpResponse;
        context : Blob;
      };
    } -> async HttpResponse;
  };

  public type HttpResponse = {
    status : Nat;
    headers : [{ name : Text; value : Text }];
    body : Blob;
  };

  let ic : IC = actor "aaaaa-aa";

  public func searchTunes(
    searchQuery : Text,
    tuneType : ?Text,
    page : Nat,
    transformFn : shared query ({ response : HttpResponse; context : Blob }) -> async HttpResponse
  ) : async Text {
    let typeParam = switch (tuneType) {
      case null { "" };
      case (?t) { "&type=" # t };
    };
    let url = "https://thesession.org/tunes/search?q=" # searchQuery # typeParam # "&format=json&perpage=20&page=" # Nat.toText(page);

    Cycles.add<system>(230_000_000_000);
    let response = await ic.http_request({
      url;
      max_response_bytes = ?2_000_000;
      method = #get;
      headers = [{ name = "User-Agent"; value = "Tunebook/2.0" }];
      body = null;
      transform = ?{ function = transformFn; context = Blob.fromArray([]) };
    });

    switch (Text.decodeUtf8(response.body)) {
      case null { "{\"error\": \"Failed to decode response\"}" };
      case (?text) { text };
    };
  };

  public func fetchTune(
    tuneId : Nat,
    transformFn : shared query ({ response : HttpResponse; context : Blob }) -> async HttpResponse
  ) : async Text {
    let url = "https://thesession.org/tunes/" # Nat.toText(tuneId) # "?format=json";

    Cycles.add<system>(230_000_000_000);
    let response = await ic.http_request({
      url;
      max_response_bytes = ?2_000_000;
      method = #get;
      headers = [{ name = "User-Agent"; value = "Tunebook/2.0" }];
      body = null;
      transform = ?{ function = transformFn; context = Blob.fromArray([]) };
    });

    switch (Text.decodeUtf8(response.body)) {
      case null { "{\"error\": \"Failed to decode response\"}" };
      case (?text) { text };
    };
  };

  public func transform(input : { response : HttpResponse; context : Blob }) : HttpResponse {
    { status = input.response.status; headers = []; body = input.response.body };
  };
};
