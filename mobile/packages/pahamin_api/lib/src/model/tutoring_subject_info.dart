//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_subject_info.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringSubjectInfo {
  /// Returns a new [TutoringSubjectInfo] instance.
  TutoringSubjectInfo({

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
    bool operator ==(Object other) => identical(this, other) || other is TutoringSubjectInfo &&
      other.id == id &&
      other.name == name;

    @override
    int get hashCode =>
        id.hashCode +
        name.hashCode;

  factory TutoringSubjectInfo.fromJson(Map<String, dynamic> json) => _$TutoringSubjectInfoFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringSubjectInfoToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

