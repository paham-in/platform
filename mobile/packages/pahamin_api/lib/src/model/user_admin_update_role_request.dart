//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_admin_update_role_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserAdminUpdateRoleRequest {
  /// Returns a new [UserAdminUpdateRoleRequest] instance.
  UserAdminUpdateRoleRequest({

     this.roles,
  });

  @JsonKey(
    
    name: r'roles',
    required: false,
    includeIfNull: false,
  )


  final List<String>? roles;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserAdminUpdateRoleRequest &&
      other.roles == roles;

    @override
    int get hashCode =>
        roles.hashCode;

  factory UserAdminUpdateRoleRequest.fromJson(Map<String, dynamic> json) => _$UserAdminUpdateRoleRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UserAdminUpdateRoleRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

