//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'push_subscribe_input_keys.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class PushSubscribeInputKeys {
  /// Returns a new [PushSubscribeInputKeys] instance.
  PushSubscribeInputKeys({

     this.auth,

     this.p256dh,
  });

  @JsonKey(
    
    name: r'auth',
    required: false,
    includeIfNull: false,
  )


  final String? auth;



  @JsonKey(
    
    name: r'p256dh',
    required: false,
    includeIfNull: false,
  )


  final String? p256dh;





    @override
    bool operator ==(Object other) => identical(this, other) || other is PushSubscribeInputKeys &&
      other.auth == auth &&
      other.p256dh == p256dh;

    @override
    int get hashCode =>
        auth.hashCode +
        p256dh.hashCode;

  factory PushSubscribeInputKeys.fromJson(Map<String, dynamic> json) => _$PushSubscribeInputKeysFromJson(json);

  Map<String, dynamic> toJson() => _$PushSubscribeInputKeysToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

