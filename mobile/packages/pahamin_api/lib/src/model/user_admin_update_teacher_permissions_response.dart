//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_admin_update_teacher_permissions_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserAdminUpdateTeacherPermissionsResponse {
  /// Returns a new [UserAdminUpdateTeacherPermissionsResponse] instance.
  UserAdminUpdateTeacherPermissionsResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserAdminUpdateTeacherPermissionsResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory UserAdminUpdateTeacherPermissionsResponse.fromJson(Map<String, dynamic> json) => _$UserAdminUpdateTeacherPermissionsResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UserAdminUpdateTeacherPermissionsResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

