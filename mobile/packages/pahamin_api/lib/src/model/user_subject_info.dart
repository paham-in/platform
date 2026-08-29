//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_subject_info.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserSubjectInfo {
  /// Returns a new [UserSubjectInfo] instance.
  UserSubjectInfo({

     this.id,

     this.name,
  });

  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserSubjectInfo &&
      other.id == id &&
      other.name == name;

    @override
    int get hashCode =>
        id.hashCode +
        name.hashCode;

  factory UserSubjectInfo.fromJson(Map<String, dynamic> json) => _$UserSubjectInfoFromJson(json);

  Map<String, dynamic> toJson() => _$UserSubjectInfoToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

