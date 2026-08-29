//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_admin_update_role_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserAdminUpdateRoleResponse {
  /// Returns a new [UserAdminUpdateRoleResponse] instance.
  UserAdminUpdateRoleResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserAdminUpdateRoleResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory UserAdminUpdateRoleResponse.fromJson(Map<String, dynamic> json) => _$UserAdminUpdateRoleResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UserAdminUpdateRoleResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

