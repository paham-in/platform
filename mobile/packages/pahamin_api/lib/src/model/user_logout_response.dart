//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_logout_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserLogoutResponse {
  /// Returns a new [UserLogoutResponse] instance.
  UserLogoutResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserLogoutResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory UserLogoutResponse.fromJson(Map<String, dynamic> json) => _$UserLogoutResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UserLogoutResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

