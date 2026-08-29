//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_admin_delete_user_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserAdminDeleteUserResponse {
  /// Returns a new [UserAdminDeleteUserResponse] instance.
  UserAdminDeleteUserResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserAdminDeleteUserResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory UserAdminDeleteUserResponse.fromJson(Map<String, dynamic> json) => _$UserAdminDeleteUserResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UserAdminDeleteUserResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

